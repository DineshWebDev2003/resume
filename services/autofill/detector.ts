import type { ATSKind } from './types';

/** Detect ATS from URL. Resilient — hostname first, then path markers. */
export function detectATS(url: string): ATSKind {
  const u = (url || '').toLowerCase();
  if (!u) return 'unknown';
  let host = '';
  try {
    host = new URL(u).hostname.toLowerCase();
  } catch {
    host = u;
  }
  if (host.includes('greenhouse.io') || host.includes('boards.greenhouse')) return 'greenhouse';
  if (host.includes('lever.co') || host.includes('jobs.lever')) return 'lever';
  if (host.includes('myworkdayjobs.com') || host.includes('workday')) return 'workday';
  // Path markers (embedded forms / proxies)
  if (u.includes('greenhouse') || u.includes('gh_jid')) return 'greenhouse';
  if (u.includes('lever') || u.includes('lever-jobs')) return 'lever';
  if (u.includes('workday') || u.includes('wd1.myworkday') || u.includes('wd5.myworkday')) return 'workday';
  if (u.startsWith('http')) return 'generic';
  return 'unknown';
}

/** Normalize a signal string before keyword matching. */
export function normalizeSignal(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** High-confidence confirmation URL patterns. */
export function confirmationConfidenceFromUrl(url: string): 'high' | 'medium' | 'low' {
  const u = (url || '').toLowerCase();
  if (/(application_submitted|application-received|application_received|successfully_applied|thank_you_for_applying|confirmation\/apply)/.test(u)) return 'high';
  if (/(thank.you|success|applied|confirmation|submitted)/.test(u)) return 'medium';
  return 'low';
}

const CONFIRM_PHRASES_HIGH = [
  'application submitted',
  'application received',
  'successfully applied',
  'your application has been received',
  'application complete',
];
const CONFIRM_PHRASES_MED = ['thank you', 'thank-you', 'application confirmation'];

export function confirmationConfidenceFromText(text: string): 'high' | 'medium' | 'low' {
  const t = (text || '').toLowerCase();
  if (CONFIRM_PHRASES_HIGH.some((p) => t.includes(p))) return 'high';
  if (CONFIRM_PHRASES_MED.some((p) => t.includes(p))) return 'medium';
  return 'low';
}
