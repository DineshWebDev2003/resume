import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ATSKind, QuickApplyQueueItem, QueueStatus } from './autofill/types';

const KEY = 'quick-apply-queue-v1';

/** Small delay between page actions — never hammer job sites. */
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function listQueue(): Promise<QuickApplyQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuickApplyQueueItem[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QuickApplyQueueItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, 200)));
}

export async function enqueueQuickApply(input: {
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  ats: ATSKind;
  note?: string;
}): Promise<QuickApplyQueueItem> {
  const items = await listQueue();
  const key = normalizeJobKey(input.jobId, input.jobUrl);
  const existing = items.find((i) => i.key === key);
  if (existing) return existing;
  const item: QuickApplyQueueItem = {
    key,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    company: input.company,
    jobUrl: input.jobUrl,
    ats: input.ats,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    note: input.note,
  };
  await writeQueue([item, ...items]);
  return item;
}

export async function setQueueStatus(key: string, status: QueueStatus, note?: string) {
  const items = await listQueue();
  const next = items.map((i) =>
    i.key === key ? { ...i, status, updatedAt: Date.now(), note: note ?? i.note } : i,
  );
  await writeQueue(next);
}

/** Normalize dedup key: stable jobId wins, else normalized URL. */
export function normalizeJobKey(jobId: string, jobUrl: string): string {
  const id = (jobId || '').trim();
  if (id && !id.startsWith('http')) return id.slice(0, 200);
  try {
    const u = new URL(jobUrl || id);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '').toLowerCase();
    const keep = u.searchParams.get('gh_jid') || u.searchParams.get('job_id') || '';
    return `${host}${path}${keep ? `?id=${keep}` : ''}`.slice(0, 200);
  } catch {
    return (jobUrl || id || Date.now().toString()).slice(0, 200);
  }
}
