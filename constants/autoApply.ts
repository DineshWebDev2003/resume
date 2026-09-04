/**
 * Auto Apply — shared constants.
 * Extension of the existing Resume Elite flow. No existing UI/logic is modified here.
 */

export type AutoApplyStatus =
  | 'Matched'
  | 'Resume Customized'
  | 'Auto Apply Queued'
  | 'Applying'
  | 'Applied'
  | 'Skipped'
  | 'Failed'
  | 'Manual Apply Required';

export const AUTO_APPLY_STATUSES: AutoApplyStatus[] = [
  'Matched',
  'Resume Customized',
  'Auto Apply Queued',
  'Applying',
  'Applied',
  'Skipped',
  'Failed',
  'Manual Apply Required',
];

export const AUTO_APPLY_STATUS_COLORS: Record<AutoApplyStatus, string> = {
  Matched: '#8b5cf6',
  'Resume Customized': '#0ea5e9',
  'Auto Apply Queued': '#f59e0b',
  Applying: '#f59e0b',
  Applied: '#10b981',
  Skipped: '#9a8aaa',
  Failed: '#ef4444',
  'Manual Apply Required': '#ea580c',
};

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';

export const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'On-site'];

export const EXPERIENCE_LEVELS = [
  'Any',
  'Internship',
  'Entry',
  'Mid',
  'Senior',
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface AutoApplySettings {
  enabled: boolean;
  paused: boolean;
  /** 1–3 roles, mirrored from the user profile (users/{uid}.jobRoles). */
  roles: string[];
  minMatch: number;
  locations: string[];
  workModes: WorkMode[];
  salaryMin: string;
  experienceLevel: ExperienceLevel;
  updatedAt?: any;
}

export const DEFAULT_AUTO_APPLY_SETTINGS: AutoApplySettings = {
  enabled: false, // Explicit opt-in. Never default ON.
  paused: false,
  roles: [],
  minMatch: 70,
  locations: [],
  workModes: ['Remote', 'Hybrid', 'On-site'],
  salaryMin: '',
  experienceLevel: 'Any',
};

export const AUTO_APPLY_DISCLOSURE =
  'Auto Apply is enabled. Resume Elite will automatically apply only to eligible jobs matching your preferences where automatic application is supported.';

/**
 * Sources allowed for automatic submission.
 * External job boards (Adzuna, Jobicy, Remotive, verified portals) do NOT
 * expose an official application API, so they always resolve to
 * "Manual Apply Required" with the legitimate application page opened.
 * Only the in-app flow (internal postings via /apply) may auto-submit.
 */
export const SUPPORTED_AUTO_APPLY_SOURCES = ['internal'] as const;

/** Max jobs processed per automatic batch run (safety cap). */
export const MAX_AUTO_APPLY_PER_DAY = 20;

/** Firestore paths (all under the existing users/{uid} tree). */
export const AUTO_APPLY_SETTINGS_PATH = (uid: string) =>
  `users/${uid}/autoApplySettings/config` as const;
