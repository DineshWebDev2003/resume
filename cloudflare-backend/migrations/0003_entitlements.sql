-- 0003_entitlements.sql
PRAGMA foreign_keys = ON;

-- Extend Better Auth core user table for app entitlements (additive, nullable/defaulted)
ALTER TABLE user ADD COLUMN isPro INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user ADD COLUMN isPremium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user ADD COLUMN resumeLimit INTEGER NOT NULL DEFAULT 3;
ALTER TABLE user ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE user ADD COLUMN updatedEntitlementsAt TEXT;

-- Optional app profile table keyed to Better Auth user id (no Firebase dependency)
CREATE TABLE IF NOT EXISTS app_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  is_pro INTEGER NOT NULL DEFAULT 0,
  is_premium INTEGER NOT NULL DEFAULT 0,
  resume_limit INTEGER NOT NULL DEFAULT 999999,
  plan TEXT NOT NULL DEFAULT 'free',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_app_profiles_email ON app_profiles(email);

-- Ensure requested premium unlimited user (email as provided; also gmail variant handled in app/backend logic)
INSERT INTO app_profiles (user_id, email, display_name, onboarding_completed, is_pro, is_premium, resume_limit, plan, updated_at)
SELECT id, email, name, 1, 1, 1, 999999, 'premium_unlimited', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM user WHERE lower(email) IN ('dinesh.mahi.dev@gmasil.com','dinesh.mahi.dev@gmail.com')
ON CONFLICT(user_id) DO UPDATE SET
  email=excluded.email,
  is_pro=1,
  is_premium=1,
  resume_limit=999999,
  plan='premium_unlimited',
  updated_at=excluded.updated_at;
