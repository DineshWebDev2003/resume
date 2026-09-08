import { auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/constants/config';
import type { AutoApplySettings } from '@/constants/autoApply';
import {
  getAutoApplyContext,
  processAutoApplyBatch,
  processJobForAutoApply,
  type AutoApplyJob,
} from './autoApply';
import { getAutoApplyRecords, saveAutoApplyRecord } from './firestore';
import { delay } from './quickApplyQueue';

/**
 * Background Auto Apply pass — runs while the app is alive (foreground or
 * backgrounded, not force-killed) whenever Auto Apply is ON.
 * Fetches keyless boards (Jobicy + Remotive), scores, tracks, and logs
 * every step so `npx expo start` shows proof it is actually working.
 */

async function fetchJobicy(tag: string): Promise<AutoApplyJob[]> {
  // Jobicy expects a single slug tag — "Frontend Developer" 400s, so use first token.
  const slug = tag.toLowerCase().trim().split(/[^a-z]+/).filter(Boolean)[0] || 'dev';
  const filtered =
    `${API_CONFIG.JOBICY_ENDPOINT}?count=20&geo=india&industry=engineering&tag=${encodeURIComponent(slug)}`;
  let res = await fetch(filtered, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    // Filter combo rejected (400) — fall back to unfiltered feed, never hard-fail.
    console.log(`[AutoApply BG] Jobicy filtered fetch ${res.status}, retrying unfiltered.`);
    res = await fetch(`${API_CONFIG.JOBICY_ENDPOINT}?count=20`, {
      headers: { Accept: 'application/json' },
    });
  }
  if (!res.ok) throw new Error(`Jobicy ${res.status}`);
  if (!res.ok) throw new Error(`Jobicy ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    id: `jobicy-${j.id}`,
    title: j.jobTitle,
    company: j.companyName,
    location: j.jobGeo || 'Remote',
    description: j.jobExcerpt || '',
    salary: j.annualSalaryMin ? `$${j.annualSalaryMin}–${j.annualSalaryMax}k/yr` : 'Competitive',
    scheduleType: 'Remote',
    source: 'jobicy',
    applyUrl: j.url,
    logo: j.companyLogo,
  }));
}

async function fetchRemotive(category: string): Promise<AutoApplyJob[]> {
  const url = `${API_CONFIG.REMOTIVE_ENDPOINT}?category=${encodeURIComponent(category || 'software-dev')}&limit=20`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Remotive ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    id: `remotive-${j.id}`,
    title: j.title,
    company: j.company_name,
    location: 'Remote Worldwide',
    description: String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
    salary: j.salary || 'Competitive',
    scheduleType: 'Remote',
    source: 'remotive',
    applyUrl: j.url,
  }));
}

let passCount = 0;
let cursorsLoaded = false;
const REMOTIVE_CATS = ['software-dev', 'data', 'devops', 'qa', 'design', 'product'];

/** Persisted cursors — survive reloads/restarts so rotation + rescore cover everything. */
async function loadCursors(): Promise<{ pass: number; rescore: number }> {
  try {
    const raw = await AsyncStorage.getItem('auto-apply-cursors-v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { pass: 0, rescore: 0 };
}

async function saveCursors(pass: number, rescore: number) {
  try {
    await AsyncStorage.setItem('auto-apply-cursors-v1', JSON.stringify({ pass, rescore }));
  } catch {}
}

export async function runBackgroundAutoApplyPass(settings: AutoApplySettings): Promise<{
  fetched: number;
  processed: number;
  saved: number;
}> {
  const started = Date.now();
  console.log('[AutoApply BG] ── background pass start ──');
  if (!settings.enabled || settings.paused) {
    console.log('[AutoApply BG] Skipped: disabled or paused.');
    return { fetched: 0, processed: 0, saved: 0 };
  }
  if (!auth.currentUser) {
    console.log('[AutoApply BG] Skipped: not logged in.');
    return { fetched: 0, processed: 0, saved: 0 };
  }

  const { profile, resume } = await getAutoApplyContext(settings);
  console.log(
    `[AutoApply BG] Profile: roles=[${profile.roles.join(', ') || 'none'}] ` +
      `location=${profile.location || 'any'} resume=${resume ? 'yes' : 'no'}.`,
  );
  if (!resume) {
    console.log('[AutoApply BG] WARNING: no resume found — matching runs on titles only. Create one in Builder for real scores.');
  }
  if (profile.roles.length === 0) {
    console.log('[AutoApply BG] Skipped: no roles in profile/settings.');
    return { fetched: 0, processed: 0, saved: 0 };
  }

  // Rotation cursors persist across reloads — every pass covers new ground.
  let passIdx = passCount;
  let rescoreCursor = 0;
  try {
    const c = await loadCursors();
    passIdx = c.pass;
    rescoreCursor = c.rescore;
    passCount = c.pass + 1;
  } catch {}
  const tag = profile.roles[passIdx % profile.roles.length];
  const remotiveCat = REMOTIVE_CATS[passIdx % REMOTIVE_CATS.length];
  console.log(`[AutoApply BG] Pass #${passIdx + 1}: tag="${tag}" remotive="${remotiveCat}".`);
  const settled = await Promise.allSettled([fetchJobicy(tag), fetchRemotive(remotiveCat)]);
  const jobs: AutoApplyJob[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[AutoApply BG] Fetched ${r.value.length} jobs from ${i === 0 ? 'Jobicy' : 'Remotive'}.`);
      jobs.push(...r.value);
    } else {
      console.log(`[AutoApply BG] Fetch failed (${i === 0 ? 'Jobicy' : 'Remotive'}):`, r.reason?.message || r.reason);
    }
  });
  console.log(`[AutoApply BG] Total fetched: ${jobs.length}.`);
  if (jobs.length === 0) return { fetched: 0, processed: 0, saved: 0 };

  const existing = new Set<string>();
  try {
    (await getAutoApplyRecords()).forEach((a: any) => existing.add(a.jobId));
  } catch (e) {
    console.log('[AutoApply BG] Could not load existing records, continuing without dedupe.');
  }
  console.log(`[AutoApply BG] Already tracked: ${existing.size}.`);

  const records = await processAutoApplyBatch(jobs, { settings, profile, resume, existingIds: existing });

  let saved = 0;
  for (const rec of records) {
    try {
      await saveAutoApplyRecord(rec);
      saved += 1;
    } catch (e: any) {
      const msg = e?.message || '';
      console.log(`[AutoApply BG] Save failed for ${rec.jobId}:`, msg);
      if (/not authenticated/i.test(msg)) {
        console.log('[AutoApply BG] Auth lost mid-pass — aborting, will retry next tick.');
        break;
      }
    }
    await delay(300); // gentle pace — never hammer Firestore
  }
  console.log(
    `[AutoApply BG] ── pass done in ${((Date.now() - started) / 1000).toFixed(1)}s: ` +
      `fetched=${jobs.length} processed=${records.length} saved=${saved} ──`,
  );

  // Rescore previously-skipped jobs with the current scorer + resume.
  // Stored records carry a description snippet, so this is full scoring.
  // Cursor rotates so every skip gets rechecked over successive passes.
  try {
    const all = await getAutoApplyRecords();
    const skippedAll = all.filter((a: any) => a.status === 'Skipped');
    const skipped = skippedAll.slice(rescoreCursor, rescoreCursor + 10);
    const nextCursor =
      skippedAll.length === 0 ? 0 : (rescoreCursor + skipped.length) % skippedAll.length;
    await saveCursors(passIdx + 1, nextCursor);
    if (skipped.length > 0) {
      console.log(`[AutoApply BG] Rescoring ${skipped.length} old skips (with stored descriptions).`);
      let upgraded = 0;
      for (const s of skipped) {
        const job: AutoApplyJob = {
          id: s.jobId,
          title: s.title,
          company: s.company,
          location: s.location || '',
          description: s.jobDescription || '',
          salary: undefined,
          scheduleType: undefined,
          source: String(s.source || 'unknown').split(':')[0],
          applyUrl: s.applyUrl,
          logo: s.logo || undefined,
        };
        const rec = await processJobForAutoApply(job, { settings, profile, resume });
        if (rec.status === 'Matched' || rec.status === 'Manual Apply Required') {
          await saveAutoApplyRecord(rec);
          upgraded += 1;
          console.log(`[AutoApply BG] Upgraded: "${rec.title}" @ ${rec.company} → ${rec.status} (${rec.matchScore}%).`);
        }
        await delay(300);
      }
      console.log(`[AutoApply BG] Rescore done: ${upgraded} upgraded of ${skipped.length} checked.`);
    }
  } catch (e: any) {
    console.log('[AutoApply BG] Rescore failed:', e?.message || e);
  }

  return { fetched: jobs.length, processed: records.length, saved };
}
