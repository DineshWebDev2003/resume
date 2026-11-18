-- 0002_no_r2_schema.sql
-- Revised no-R2 migration: no server-side resume file storage, no R2/temp uploads.
-- Keeps Better Auth-compatible user/session/account/verification tables.
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS temporary_uploads;
DROP TABLE IF EXISTS ats_jobs;
DROP TABLE IF EXISTS resumes;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  auth_provider TEXT,
  legacy_firebase_uid TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS resume_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_resume_id TEXT,
  resume_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  text_extraction_status TEXT NOT NULL DEFAULT 'unknown' CHECK (text_extraction_status IN ('unknown','extracted','failed','partial')),
  extracted_text_hash TEXT,
  extracted_text TEXT, -- store only if explicitly required/approved; keep limited
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS job_descriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  company TEXT,
  source_url TEXT,
  description_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ats_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resume_record_id TEXT REFERENCES resume_records(id) ON DELETE SET NULL,
  job_description_id TEXT REFERENCES job_descriptions(id) ON DELETE SET NULL,
  ats_score INTEGER CHECK (ats_score IS NULL OR (ats_score >= 0 AND ats_score <= 100)),
  analysis_json TEXT,
  missing_keywords_json TEXT,
  skills_analysis_json TEXT,
  improvement_suggestions_json TEXT,
  job_compatibility_score INTEGER CHECK (job_compatibility_score IS NULL OR (job_compatibility_score >= 0 AND job_compatibility_score <= 100)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS job_matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resume_record_id TEXT REFERENCES resume_records(id) ON DELETE SET NULL,
  job_description_id TEXT REFERENCES job_descriptions(id) ON DELETE SET NULL,
  ats_report_id TEXT REFERENCES ats_reports(id) ON DELETE SET NULL,
  match_score INTEGER CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS application_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resume_record_id TEXT REFERENCES resume_records(id) ON DELETE SET NULL,
  job_description_id TEXT REFERENCES job_descriptions(id) ON DELETE SET NULL,
  job_external_id TEXT,
  status TEXT NOT NULL DEFAULT 'tracked',
  applied_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS usage_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  ats_requests_count INTEGER NOT NULL DEFAULT 0,
  ai_tokens_estimate INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_users_legacy_firebase_uid ON users(legacy_firebase_uid);
CREATE INDEX IF NOT EXISTS idx_resume_records_user_created ON resume_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_reports_user_created ON ats_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_reports_resume ON ats_reports(resume_record_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_created ON job_descriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_created ON job_matches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_history_user_created ON application_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_period ON usage_limits(user_id, period_key);
