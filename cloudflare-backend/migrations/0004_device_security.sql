-- 0004_device_security.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS device_registrations (
  device_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_ip TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked'))
);

CREATE TABLE IF NOT EXISTS account_device_bindings (
  user_id TEXT PRIMARY KEY,
  primary_device_id TEXT NOT NULL,
  bound_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_user ON device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_email ON device_registrations(email);
