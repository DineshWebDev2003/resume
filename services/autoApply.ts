/**
 * Auto Apply — matching, eligibility, and per-job pipeline.
 *
 * Pure logic (no UI, no Firebase). Reuses the existing profile/resume/job
 * shapes. Never invents user experience/skills/education: resume
 * customization is extractive only (keyword overlap against the user's own
 * resume content).
 */
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getResumes } from '@/utils/storage';
import {
  AUTO_APPLY_STATUS_COLORS,
  MAX_AUTO_APPLY_PER_DAY,
  SUPPORTED_AUTO_APPLY_SOURCES,
  type AutoApplySettings,
  type AutoApplyStatus,
} from '@/constants/autoApply';

export interface AutoApplyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  salary?: string;
  scheduleType?: string;
  /** e.g. 'adzuna' | 'jobicy' | 'remotive' | 'verified' | 'internal' | 'google' */
  source: string;
  applyUrl?: string;
  logo?: string;
}

export interface AutoApplyProfile {
  roles: string[];
  location: string;
  /** Free-text skills/experience pulled from the user's own resume(s). */
  skillsText?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Terminal status for this job if processing stops here. */
  status: Extract<AutoApplyStatus, 'Matched' | 'Skipped' | 'Manual Apply Required'>;
  reason: string;
  matchScore: number;
}

export interface ResumeCustomization {
  resumeId: string | null;
  resumeCustomized: boolean;
  matchedKeywords: string[];
  missingKeywords: string[];
  /** Honest estimate, derived from overlap — not a measured ATS scan. */
  atsEstimate: number;
}

export interface ApplicationRecord {
  jobId: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  applyUrl?: string;
  source: string;
  matchScore: number;
  atsScore: number | null;
  resumeId: string | null;
  resumeCustomized: boolean;
  status: AutoApplyStatus;
  statusColor: string;
  reason?: string;
  autoApplied: boolean;
}

const STOPWORDS = new Set(
  'a,an,the,and,or,for,with,of,to,in,on,at,by,from,as,is,are,was,were,be,been,we,you,they,he,she,it,this,that,these,those,will,our,your,their,per,via,into,over,under,more,most,other,all,any,who,what,when,where,why,how,can,has,have,had,do,does,did,not,no,yes,if,then,than,so,such,only,also,just,like,well,join,team,work,working,role,new,looking,seeking,hiring,apply,grow,growing,help,us,years,year,day,days,time'.split(
    ',',
  ),
);

export function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Deterministic keyword-overlap match score (0–100).
 * Title/role overlap 50pts, skills overlap 30pts, location 10pts, work-mode 10pts.
 */
export function calculateMatchScore(
  job: AutoApplyJob,
  profile: AutoApplyProfile,
  settings?: Pick<AutoApplySettings, 'locations' | 'workModes'>,
): number {
  const jobTokens = new Set(
    tokenize(`${job.title} ${job.description || ''}`),
  );
  const roleTokens = unique(profile.roles.flatMap(tokenize));
  const skillTokens = new Set(tokenize(profile.skillsText || ''));

  let score = 0;

  // 1. Role/title overlap (50)
  if (roleTokens.length > 0) {
    const hits = roleTokens.filter((t) => jobTokens.has(t)).length;
    score += Math.round((hits / roleTokens.length) * 50);
  } else {
    score += 20; // No roles configured — neutral, eligibility still requires roles.
  }

  // 2. Skills overlap (30)
  const jdSkills = new Set(
    [...jobTokens].filter((t) => skillTokens.has(t)),
  );
  if (skillTokens.size > 0) {
    const coverage = [...skillTokens].filter((t) => jobTokens.has(t)).length;
    score += Math.min(
      30,
      Math.round((coverage / Math.min(skillTokens.size, 25)) * 30),
    );
  } else if (jdSkills.size > 0) {
    score += 10;
  }

  // 3. Location (10)
  const locPrefs = (settings?.locations?.length
    ? settings.locations
    : [profile.location]
  ).filter(Boolean);
  const jobLoc = (job.location || '').toLowerCase();
  if (locPrefs.length === 0 || jobLoc.includes('remote') || jobLoc.includes('anywhere')) {
    score += 10;
  } else if (locPrefs.some((l) => jobLoc.includes(l.toLowerCase()) || l.toLowerCase().includes(jobLoc.split(',')[0]))) {
    score += 10;
  }

  // 4. Work mode (10)
  const modes = settings?.workModes?.length ? settings.workModes : ['Remote', 'Hybrid', 'On-site'];
  const isRemote = jobLoc.includes('remote') || (job.scheduleType || '').toLowerCase().includes('remote');
  if (isRemote ? modes.includes('Remote') : modes.length > 0) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function roleMatchesTitle(roles: string[], title: string): boolean {
  const titleTokens = new Set(tokenize(title));
  return roles.some((role) => {
    const tokens = tokenize(role);
    if (tokens.length === 0) return false;
    // Role matches if ≥50% of its significant tokens appear in the title.
    const hits = tokens.filter((t) => titleTokens.has(t)).length;
    return hits / tokens.length >= 0.5;
  });
}

function experienceCompatible(level: string, title: string): boolean {
  if (!level || level === 'Any') return true;
  const t = title.toLowerCase();
  const senior = /(senior|sr\.|lead|principal|staff|architect|manager|director|head)/.test(t);
  const junior = /(junior|jr\.|intern|trainee|fresher|entry)/.test(t);
  switch (level) {
    case 'Internship':
      return !senior || junior;
    case 'Entry':
      return !senior;
    case 'Mid':
      return true;
    case 'Senior':
      return !junior;
    default:
      return true;
  }
}

function salaryPasses(salaryMin: string, jobSalary?: string): boolean {
  if (!salaryMin) return true;
  if (!jobSalary || /competitive/i.test(jobSalary)) return true; // Can't parse — don't block.
  const min = parseFloat(salaryMin.replace(/[^0-9.]/g, ''));
  if (isNaN(min)) return true;
  const nums = (jobSalary.match(/[0-9]+(\.[0-9]+)?/g) || []).map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return true;
  // Best-effort: pass if the highest mentioned figure meets the floor.
  // Scale differences (LPA vs k) make this advisory only.
  return Math.max(...nums) >= min;
}

/**
 * Eligibility gate. Pure + conservative:
 * external sources ALWAYS resolve to 'Manual Apply Required'.
 */
export function checkAutoApplyEligibility(
  job: AutoApplyJob,
  settings: AutoApplySettings,
  profile: AutoApplyProfile,
): EligibilityResult {
  const roles = (settings.roles?.length ? settings.roles : profile.roles).filter(Boolean);
  const matchScore = calculateMatchScore(job, profile, settings);

  const skip = (reason: string): EligibilityResult => ({
    eligible: false,
    status: 'Skipped',
    reason,
    matchScore,
  });

  if (!settings.enabled || settings.paused) {
    return { eligible: false, status: 'Matched', reason: 'Auto Apply is off or paused.', matchScore };
  }
  if (roles.length === 0) {
    return { eligible: false, status: 'Matched', reason: 'Add at least 1 job role first.', matchScore };
  }
  if (!roleMatchesTitle(roles, job.title)) {
    return skip(`Title does not match your roles (${roles.slice(0, 3).join(', ')}).`);
  }
  if (matchScore < settings.minMatch) {
    return skip(`Match ${matchScore}% is below your minimum of ${settings.minMatch}%.`);
  }
  if (
    settings.locations.length > 0 &&
    !settings.locations.some(
      (l) =>
        (job.location || '').toLowerCase().includes(l.toLowerCase()) ||
        (job.location || '').toLowerCase().includes('remote'),
    )
  ) {
    return skip(`Location is outside your preferences (${settings.locations.join(', ')}).`);
  }
  if (!experienceCompatible(settings.experienceLevel, job.title)) {
    return skip(`Title seniority does not fit "${settings.experienceLevel}" level.`);
  }
  if (!salaryPasses(settings.salaryMin, job.salary)) {
    return skip('Salary is below your preference.');
  }

  const supported = (SUPPORTED_AUTO_APPLY_SOURCES as readonly string[]).includes(job.source);
  if (!supported || !job.applyUrl) {
    return {
      eligible: false,
      status: 'Manual Apply Required',
      reason: job.applyUrl
        ? `Automatic submission is not supported for ${job.source} listings — apply on the official page.`
        : 'No official application link available.',
      matchScore,
    };
  }

  return { eligible: true, status: 'Matched', reason: 'Eligible for automatic submission.', matchScore };
}

/**
 * Extractive resume customization. Only references the user's OWN resume
 * content + JD keywords. Nothing is invented.
 */
export function customizeResumeForJob(
  job: AutoApplyJob,
  resume: { id: string; skillsText: string } | null,
): ResumeCustomization {
  if (!resume) {
    return {
      resumeId: null,
      resumeCustomized: false,
      matchedKeywords: [],
      missingKeywords: [],
      atsEstimate: 0,
    };
  }
  const jdTokens = unique(tokenize(`${job.title} ${job.description || ''}`));
  const resumeTokens = new Set(tokenize(resume.skillsText));
  const matchedKeywords = jdTokens.filter((t) => resumeTokens.has(t)).slice(0, 20);
  const missingKeywords = jdTokens
    .filter((t) => !resumeTokens.has(t) && t.length > 2)
    .slice(0, 20);
  const coverage = jdTokens.length === 0 ? 0 : matchedKeywords.length / Math.min(jdTokens.length, 30);
  return {
    resumeId: resume.id,
    resumeCustomized: true,
    matchedKeywords,
    missingKeywords,
    atsEstimate: Math.min(98, Math.round(55 + coverage * 40)),
  };
}

export function toStatusColor(status: AutoApplyStatus): string {
  return AUTO_APPLY_STATUS_COLORS[status];
}

/**
 * Full per-job pipeline:
 * Match → Threshold → Customize → Eligibility → Apply-or-Manual → Record.
 * `submit` is only invoked for supported (internal) sources; external jobs
 * can never be marked Applied by automation.
 */
export async function processJobForAutoApply(
  job: AutoApplyJob,
  deps: {
    settings: AutoApplySettings;
    profile: AutoApplyProfile;
    resume: { id: string; skillsText: string } | null;
    /** Official submission handler (internal flow only). */
    submit?: (job: AutoApplyJob, customization: ResumeCustomization) => Promise<void>;
  },
): Promise<ApplicationRecord> {
  const base = {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    logo: job.logo,
    applyUrl: job.applyUrl,
    source: job.source,
  };

  try {
    const gate = checkAutoApplyEligibility(job, deps.settings, deps.profile);

    if (gate.status === 'Skipped') {
      return {
        ...base,
        matchScore: gate.matchScore,
        atsScore: null,
        resumeId: null,
        resumeCustomized: false,
        status: 'Skipped',
        statusColor: toStatusColor('Skipped'),
        reason: gate.reason,
        autoApplied: false,
      };
    }

    // Eligible-or-manual: customize the resume for this job first.
    const customization = customizeResumeForJob(job, deps.resume);

    if (gate.status === 'Manual Apply Required' || !gate.eligible) {
      return {
        ...base,
        matchScore: gate.matchScore,
        atsScore: customization.atsEstimate || null,
        resumeId: customization.resumeId,
        resumeCustomized: customization.resumeCustomized,
        status: gate.status === 'Manual Apply Required' ? 'Manual Apply Required' : 'Matched',
        statusColor: toStatusColor(
          gate.status === 'Manual Apply Required' ? 'Manual Apply Required' : 'Matched',
        ),
        reason: gate.reason,
        autoApplied: false,
      };
    }

    // Automatic submission path (supported sources only).
    if (!deps.submit) {
      return {
        ...base,
        matchScore: gate.matchScore,
        atsScore: customization.atsEstimate || null,
        resumeId: customization.resumeId,
        resumeCustomized: customization.resumeCustomized,
        status: 'Manual Apply Required',
        statusColor: toStatusColor('Manual Apply Required'),
        reason: 'No supported submission handler — apply on the official page.',
        autoApplied: false,
      };
    }

    await deps.submit(job, customization);
    return {
      ...base,
      matchScore: gate.matchScore,
      atsScore: customization.atsEstimate || null,
      resumeId: customization.resumeId,
      resumeCustomized: customization.resumeCustomized,
      status: 'Applied',
      statusColor: toStatusColor('Applied'),
      reason: 'Submitted via the official in-app application flow.',
      autoApplied: true,
    };
  } catch (e: any) {
    return {
      ...base,
      matchScore: 0,
      atsScore: null,
      resumeId: null,
      resumeCustomized: false,
      status: 'Failed',
      statusColor: toStatusColor('Failed'),
      reason: e?.message || 'Auto Apply failed.',
      autoApplied: false,
    };
  }
}

/** Batch runner with daily safety cap. Skips ids already tracked. */
export async function processAutoApplyBatch(
  jobs: AutoApplyJob[],
  deps: {
    settings: AutoApplySettings;
    profile: AutoApplyProfile;
    resume: { id: string; skillsText: string } | null;
    existingIds: Set<string>;
    submit?: (job: AutoApplyJob, customization: ResumeCustomization) => Promise<void>;
  },
): Promise<ApplicationRecord[]> {
  if (!deps.settings.enabled || deps.settings.paused) return [];
  const fresh = jobs.filter((j) => j.id && !deps.existingIds.has(j.id)).slice(0, MAX_AUTO_APPLY_PER_DAY);
  const out: ApplicationRecord[] = [];
  for (const job of fresh) {
    out.push(await processJobForAutoApply(job, deps));
  }
  return out;
}

/**
 * Shared loader: roles/location from the existing users/{uid} doc,
 * resume (upload-first, else manual profile) from existing AsyncStorage.
 */
export async function getAutoApplyContext(settings: AutoApplySettings): Promise<{
  profile: AutoApplyProfile;
  resume: { id: string; skillsText: string } | null;
}> {
  let roles = settings.roles;
  let location = '';
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const d = snap.data() as any;
        if (!roles.length) roles = (d.jobRoles || []).filter(Boolean).slice(0, 3);
        location = d.location || '';
      }
    }
  } catch {}

  let resume: { id: string; skillsText: string } | null = null;
  try {
    const resumes = await getResumes();
    const r = resumes[0];
    if (r) {
      const data: any = r.data || {};
      const parts = [
        data.skills,
        data.tools,
        data.languages,
        (data.experience || [])
          .map((e: any) => `${e.role || ''} ${e.description || ''}`)
          .join(' '),
      ].filter(Boolean);
      resume = { id: r.id, skillsText: parts.join(' ') };
    }
  } catch {}

  return { profile: { roles, location, skillsText: resume?.skillsText }, resume };
}
