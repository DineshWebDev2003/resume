import type { Env } from "./env";

export const nowIso = () => new Date().toISOString();

export const PREMIUM_EMAILS = new Set(["dinesh.mahi.dev@gmail.com"]);

export function isPremiumEmail(email?: string | null) {
  if (!email) return false;
  return PREMIUM_EMAILS.has(email.toLowerCase().trim());
}

export type ResumeRecord = {
  id: string;
  user_id: string;
  client_resume_id: string | null;
  resume_name: string;
  file_type: string | null;
  file_size: number | null;
  text_extraction_status: string;
  extracted_text_hash: string | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

export type JobDescription = {
  id: string;
  user_id: string;
  title: string | null;
  company: string | null;
  source_url: string | null;
  description_text: string;
  created_at: string;
  updated_at: string;
};

export type AtsReport = {
  id: string;
  user_id: string;
  resume_record_id: string | null;
  job_description_id: string | null;
  ats_score: number | null;
  analysis_json: string | null;
  missing_keywords_json: string | null;
  skills_analysis_json: string | null;
  improvement_suggestions_json: string | null;
  job_compatibility_score: number | null;
  created_at: string;
};

export async function createOrUpdateResumeRecord(db: D1Database, args: Partial<ResumeRecord> & { id: string; user_id: string; resume_name: string }) {
  const now = nowIso();
  await db.prepare(
    `INSERT INTO resume_records (id, user_id, client_resume_id, resume_name, file_type, file_size, text_extraction_status, extracted_text_hash, extracted_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       client_resume_id=excluded.client_resume_id,
       resume_name=excluded.resume_name,
       file_type=excluded.file_type,
       file_size=excluded.file_size,
       text_extraction_status=excluded.text_extraction_status,
       extracted_text_hash=excluded.extracted_text_hash,
       extracted_text=excluded.extracted_text,
       updated_at=excluded.updated_at`
  ).bind(
    args.id,
    args.user_id,
    args.client_resume_id ?? null,
    args.resume_name,
    args.file_type ?? null,
    args.file_size ?? null,
    args.text_extraction_status ?? "extracted",
    args.extracted_text_hash ?? null,
    args.extracted_text ?? null,
    now,
    now,
  ).run();
  return getResumeRecord(db, args.user_id, args.id);
}

export async function getResumeRecord(db: D1Database, userId: string, id: string) {
  return db.prepare(`SELECT * FROM resume_records WHERE id=? AND user_id=?`).bind(id, userId).first<ResumeRecord>();
}

export async function listResumeRecords(db: D1Database, userId: string, limit: number, offset: number) {
  const { results } = await db.prepare(
    `SELECT * FROM resume_records WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all<ResumeRecord>();
  return results ?? [];
}

export async function createJobDescription(db: D1Database, args: { id: string; user_id: string; title?: string | null; company?: string | null; source_url?: string | null; description_text: string }) {
  const now = nowIso();
  await db.prepare(
    `INSERT INTO job_descriptions (id, user_id, title, company, source_url, description_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(args.id, args.user_id, args.title ?? null, args.company ?? null, args.source_url ?? null, args.description_text, now, now).run();
  return getJobDescription(db, args.user_id, args.id);
}

export async function getJobDescription(db: D1Database, userId: string, id: string) {
  return db.prepare(`SELECT * FROM job_descriptions WHERE id=? AND user_id=?`).bind(id, userId).first<JobDescription>();
}

export async function createAtsReport(db: D1Database, args: {
  id: string; user_id: string; resume_record_id?: string | null; job_description_id?: string | null;
  ats_score?: number | null; analysis_json?: any; missing_keywords_json?: any; skills_analysis_json?: any;
  improvement_suggestions_json?: any; job_compatibility_score?: number | null;
}) {
  const j = (v: any) => (v == null ? null : JSON.stringify(v));
  await db.prepare(
    `INSERT INTO ats_reports (id, user_id, resume_record_id, job_description_id, ats_score, analysis_json, missing_keywords_json, skills_analysis_json, improvement_suggestions_json, job_compatibility_score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    args.id, args.user_id, args.resume_record_id ?? null, args.job_description_id ?? null,
    args.ats_score ?? null, j(args.analysis_json), j(args.missing_keywords_json), j(args.skills_analysis_json),
    j(args.improvement_suggestions_json), args.job_compatibility_score ?? null, nowIso(),
  ).run();
  return getAtsReport(db, args.user_id, args.id);
}

export async function getAtsReport(db: D1Database, userId: string, id: string) {
  return db.prepare(`SELECT * FROM ats_reports WHERE id=? AND user_id=?`).bind(id, userId).first<AtsReport>();
}

export async function listAtsReports(db: D1Database, userId: string, limit: number, offset: number) {
  const { results } = await db.prepare(
    `SELECT * FROM ats_reports WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all<AtsReport>();
  return results ?? [];
}

export async function incrementUsage(db: D1Database, userId: string, periodKey: string, reqInc = 1, tokens = 0) {
  const now = nowIso();
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO usage_limits (id, user_id, period_key, ats_requests_count, ai_tokens_estimate, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, period_key) DO UPDATE SET
       ats_requests_count = ats_requests_count + excluded.ats_requests_count,
       ai_tokens_estimate = ai_tokens_estimate + excluded.ai_tokens_estimate,
       updated_at = excluded.updated_at`
  ).bind(id, userId, periodKey, reqInc, tokens, now).run();
}

export async function getUsage(db: D1Database, userId: string, periodKey: string) {
  return db.prepare(`SELECT * FROM usage_limits WHERE user_id=? AND period_key=?`).bind(userId, periodKey).first<any>();
}

export async function ensureAppProfile(db: D1Database, userId: string, email?: string | null, displayName?: string | null) {
  const premium = isPremiumEmail(email);
  const now = nowIso();
  const existing = await db.prepare(`SELECT * FROM app_profiles WHERE user_id=?`).bind(userId).first<any>();
  if (!existing) {
    await db.prepare(
      `INSERT INTO app_profiles (user_id, email, display_name, onboarding_completed, is_pro, is_premium, resume_limit, plan, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`
    ).bind(userId, email ?? null, displayName ?? null, premium ? 1 : 0, premium ? 1 : 0, premium ? 999999 : 3, premium ? 'premium_unlimited' : 'free', now, now).run();
  } else {
    await db.prepare(
      `UPDATE app_profiles SET email=COALESCE(?, email), display_name=COALESCE(?, display_name),
        is_pro=CASE WHEN ?=1 THEN 1 ELSE is_pro END,
        is_premium=CASE WHEN ?=1 THEN 1 ELSE is_premium END,
        resume_limit=CASE WHEN ?=1 THEN 999999 ELSE resume_limit END,
        plan=CASE WHEN ?=1 THEN 'premium_unlimited' ELSE plan END,
        updated_at=? WHERE user_id=?`
    ).bind(email ?? null, displayName ?? null, premium?1:0, premium?1:0, premium?1:0, premium?1:0, now, userId).run();
  }
  return getEntitlements(db, userId, email);
}

export async function getEntitlements(db: D1Database, userId: string, email?: string | null) {
  const row = await db.prepare(`SELECT * FROM app_profiles WHERE user_id=?`).bind(userId).first<any>();
  const premium = isPremiumEmail(email) || !!row?.is_premium || !!row?.is_pro || row?.plan === 'premium_unlimited';
  return {
    userId,
    email: email ?? row?.email ?? null,
    isPro: premium ? true : !!row?.is_pro,
    isPremium: premium,
    resumeLimit: premium ? 999999 : (row?.resume_limit ?? 3),
    plan: premium ? 'premium_unlimited' : (row?.plan ?? 'free'),
    onboardingCompleted: !!row?.onboarding_completed,
  };
}
