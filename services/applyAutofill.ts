import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getResumes } from '@/utils/storage';
import { saveJobApplication, saveAutoApplyRecord } from './firestore';
import type { ApplicationRecord } from './autoApply';
import { detectATS, confirmationConfidenceFromUrl, confirmationConfidenceFromText } from './autofill/detector';
import { buildSmartAutofillJS, buildSignalScanJS } from './autofill/core';
import { normalizeJobKey, enqueueQuickApply } from './quickApplyQueue';
import type {
  ATSKind,
  MinimalApplyProfile,
  ApplyStatus,
  QuickApplySource,
  QuickApplyRecord,
  ApplyErrorCode,
} from './autofill/types';

export type { ATSKind, MinimalApplyProfile, ApplyStatus, QuickApplySource, QuickApplyRecord, ApplyErrorCode };
export { detectATS, normalizeJobKey, enqueueQuickApply };

export interface ApplyProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  title: string;
  summary: string;
  skills: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

/** Pull name/email/phone/location from users/{uid} + first resume. Minimum data only. */
export async function getApplyProfile(): Promise<ApplyProfile> {
  let name = auth.currentUser?.displayName || '';
  let email = auth.currentUser?.email || '';
  let phone = '';
  let location = '';
  let city = '';
  let portfolio = '';
  let linkedin = '';
  let github = '';
  let website = '';
  let title = '';
  let summary = '';
  let skills = '';

  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d: any = snap.data();
        name = d.name || name;
        email = d.email || email;
        phone = d.phone || '';
        location = d.location || '';
        city = d.city || '';
        portfolio = d.portfolio || '';
        linkedin = d.linkedin || '';
        title = d.primaryRole || (d.jobRoles || [])[0] || '';
      }
    }
  } catch {}

  try {
    const resumes = await getResumes();
    const r = resumes[0];
    if (r?.data) {
      const d: any = r.data;
      name = d.name || name;
      email = d.email || email;
      phone = d.phone || phone;
      title = d.title || title;
      summary = d.summary || '';
      skills = [d.skills, d.tools, d.languages].filter(Boolean).join(', ');
      const links: any[] = d.links || [];
      const find = (k: string) =>
        links.find((l) => `${l.label || ''} ${l.url || ''}`.toLowerCase().includes(k))?.url || '';
      const first = links[0]?.url || '';
      if (!portfolio) portfolio = find('portfolio') || find('website') || first;
      linkedin = find('linkedin');
      github = find('github');
      website = find('website') || first;
    }
  } catch {}

  const parts = name.trim().split(/\s+/);
  return {
    name,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    email,
    phone,
    location,
    city,
    title,
    summary,
    skills,
    portfolio,
    linkedin,
    github,
    website,
  };
}

/** Strip to the minimum fields the WebView is allowed to see. */
export function toMinimalProfile(p: ApplyProfile): MinimalApplyProfile {
  const city = p.city || (p.location || '').split(',')[0].trim();
  return {
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    fullName: p.name || '',
    email: p.email || '',
    phone: p.phone || '',
    location: p.location || '',
    city: city || '',
    linkedin: p.linkedin || '',
    portfolio: p.portfolio || '',
    github: p.github || '',
    website: p.website || p.portfolio || '',
  };
}

/**
 * Smart autofill JS for a known URL. Selects the ATS adapter, fills only
 * known-safe fields, reports {filledCount, skippedCount, fields[]}.
 * User reviews before submitting — never auto-submits.
 */
export function buildAutofillJS(p: ApplyProfile, url?: string): string {
  const ats = detectATS(url || '');
  return buildSmartAutofillJS(toMinimalProfile(p), ats);
}

/** Signal-only scan posted on page load (no filling). */
export function buildPageSignalJS(url: string): string {
  return buildSignalScanJS(detectATS(url));
}

// --- Confirmation (backward compatible boolean + detailed) ---

export interface ConfirmationResult {
  isConfirmation: boolean;
  confidence: 'high' | 'medium' | 'low';
  state: ApplyStatus;
}

/** Detailed confirmation: URL + title + optional visible body text. */
export function detectConfirmation(
  url: string,
  title = '',
  bodyText = '',
): ConfirmationResult {
  const urlConf = confirmationConfidenceFromUrl(url + ' ' + title);
  const textConf = bodyText ? confirmationConfidenceFromText(bodyText) : 'low';
  const rank = (c: string) => (c === 'high' ? 2 : c === 'medium' ? 1 : 0);
  const best = rank(urlConf) >= rank(textConf) ? urlConf : textConf;
  // Only high confidence => submitted. Everything else stays review_required.
  if (best === 'high') return { isConfirmation: true, confidence: 'high', state: 'submitted' };
  if (best === 'medium') return { isConfirmation: true, confidence: 'medium', state: 'review_required' };
  return { isConfirmation: false, confidence: 'low', state: 'unknown' };
}

/** Legacy signature kept for job-details / existing callers. */
export function looksLikeAppliedConfirmation(url: string, title = ''): boolean {
  return detectConfirmation(url, title).isConfirmation;
}

// --- Tracking (compatible with getMyApplications / getAutoApplyRecords) ---

/**
 * Save a Quick Apply result without duplicates. Writes the legacy
 * job_applications doc (best-effort) + the auto-apply subcollection record
 * (source quick_apply | external_browser). Returns dedup key.
 */
export async function saveQuickApplyRecord(input: {
  jobId: string;
  jobTitle: string;
  company: string;
  location?: string;
  logo?: string;
  jobUrl: string;
  source: QuickApplySource;
  ats: ATSKind;
  filledFieldsCount: number;
}): Promise<{ key: string; alreadyTracked: boolean }> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const key = normalizeJobKey(input.jobId, input.jobUrl);
  let alreadyTracked = false;

  try {
    await saveJobApplication({
      id: input.jobId,
      title: input.jobTitle,
      company: input.company,
      location: input.location || '',
      logo: input.logo || null,
    });
  } catch (e: any) {
    if (String(e?.message || '').toLowerCase().includes('already applied')) {
      alreadyTracked = true;
    } else {
      throw e;
    }
  }

  const record: ApplicationRecord = {
    jobId: input.jobId,
    title: input.jobTitle,
    company: input.company,
    location: input.location || '',
    logo: input.logo || undefined,
    applyUrl: input.jobUrl,
    source: input.source === 'quick_apply' ? `quick_apply:${input.ats}` : 'external_browser',
    matchScore: 0,
    atsScore: null,
    resumeId: null,
    resumeCustomized: false,
    status: 'Applied',
    statusColor: '#10b981',
    reason:
      input.source === 'quick_apply'
        ? `Quick Apply (${input.ats}) — ${input.filledFieldsCount} fields autofilled, reviewed by user before submit.`
        : 'Applied manually in Chrome. Tracked after return.',
    autoApplied: false,
  };
  await saveAutoApplyRecord(record);

  const stored: QuickApplyRecord = {
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    company: input.company,
    jobUrl: input.jobUrl,
    appliedAt: new Date().toISOString(),
    status: 'submitted',
    source: input.source,
    ats: input.ats,
    filledFieldsCount: input.filledFieldsCount,
  };
  await enqueueQuickApply({
    jobId: stored.jobId,
    jobTitle: stored.jobTitle,
    company: stored.company,
    jobUrl: stored.jobUrl,
    ats: stored.ats,
    note: `submitted:${stored.filledFieldsCount}`,
  }).catch(() => {});

  return { key, alreadyTracked };
}

export function toUserError(code: ApplyErrorCode): string {
  switch (code) {
    case 'ATS_UNSUPPORTED':
      return 'This application form is not supported in Quick Apply. Continue in Chrome.';
    case 'LOGIN_REQUIRED':
      return 'Login required on the employer site. Sign in, then come back to autofill.';
    case 'RESUME_UPLOAD_REQUIRED':
      return 'Resume upload required — tap to upload your resume file.';
    case 'QUESTION_REQUIRES_ANSWER':
      return 'Please answer this question.';
    case 'CAPTCHA_DETECTED':
      return 'Verification required. Please complete it manually.';
    case 'FORM_FAILED_TO_LOAD':
      return 'Form failed to load. Check connection or Continue in Chrome.';
    case 'SUBMISSION_FAILED':
      return 'Application submission failed. Please review and try again.';
    case 'NETWORK_ERROR':
      return 'Network error. Please try again.';
  }
}
