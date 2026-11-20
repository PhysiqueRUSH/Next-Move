-- NEXT MOVE · Cloudflare D1 (SQLite)
CREATE TABLE IF NOT EXISTS families (
  parent_uid TEXT PRIMARY KEY,
  child_uid TEXT UNIQUE,
  pairing_hash TEXT,
  pairing_expires INTEGER DEFAULT 0,
  state_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  parent_uid TEXT NOT NULL,
  task_id TEXT NOT NULL,
  day TEXT NOT NULL,
  planned_at INTEGER,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  elapsed_s INTEGER,
  late_s INTEGER,
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  validation TEXT NOT NULL DEFAULT 'self',
  UNIQUE(parent_uid,task_id,day)
);
CREATE INDEX IF NOT EXISTS runs_by_family ON runs(parent_uid,day);
CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  parent_uid TEXT NOT NULL,
  source TEXT NOT NULL UNIQUE,
  delta_xp INTEGER NOT NULL DEFAULT 0,
  delta_coins INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_by_family ON ledger(parent_uid,at);
CREATE TABLE IF NOT EXISTS reward_requests (
  id TEXT PRIMARY KEY,
  parent_uid TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE TABLE IF NOT EXISTS homework (
  id TEXT PRIMARY KEY,
  parent_uid TEXT NOT NULL,
  subject TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  due TEXT,
  estimate INTEGER NOT NULL,
  day TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  uid TEXT PRIMARY KEY,
  parent_uid TEXT NOT NULL,
  token TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS push_sent (
  key TEXT PRIMARY KEY,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pair_attempts (
  uid TEXT PRIMARY KEY,
  bucket INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS day_plans (
  parent_uid TEXT NOT NULL,
  day TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(parent_uid,day)
);