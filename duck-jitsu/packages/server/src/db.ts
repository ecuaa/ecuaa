import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type Db = Database.Database;

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  is_guest INTEGER NOT NULL DEFAULT 0,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'yellow',
  avatar_accessory TEXT NOT NULL DEFAULT 'none',
  soft_currency INTEGER NOT NULL DEFAULT 0,
  premium_currency INTEGER NOT NULL DEFAULT 0,
  trophies INTEGER NOT NULL DEFAULT 0,
  ads_removed INTEGER NOT NULL DEFAULT 0,
  starter_pack_claimed INTEGER NOT NULL DEFAULT 0,
  tutorial_completed INTEGER NOT NULL DEFAULT 0,
  has_defeated_sensei INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  daily_reward_streak INTEGER NOT NULL DEFAULT 0,
  daily_reward_last_claimed_at TEXT,
  spin_wheel_last_spun_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS owned_cards (
  user_id TEXT NOT NULL REFERENCES users(id),
  card_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  duplicates INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS clans (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  banner_color TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  leader_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clan_members (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  clan_id TEXT NOT NULL REFERENCES clans(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reward_soft INTEGER NOT NULL DEFAULT 0,
  reward_premium INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_links (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  addressee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_missions (
  user_id TEXT NOT NULL REFERENCES users(id),
  date_key TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date_key, mission_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  player_a_id TEXT NOT NULL,
  player_b_id TEXT NOT NULL,
  player_a_name TEXT NOT NULL,
  player_b_name TEXT NOT NULL,
  winner TEXT NOT NULL,
  win_reason TEXT NOT NULL,
  trophy_delta_a INTEGER NOT NULL DEFAULT 0,
  trophy_delta_b INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_player_a ON matches(player_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_b ON matches(player_b_id);
CREATE INDEX IF NOT EXISTS idx_users_trophies ON users(trophies DESC);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_mail_user ON mail_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_links_requester ON friend_links(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_links_addressee ON friend_links(addressee_id);
`;

export function createDb(dbPath: string): Db {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(MIGRATIONS);
  // Defensive migration for databases created before this column existed -- CREATE TABLE IF NOT
  // EXISTS above is a no-op against an already-existing table, so new columns need this instead.
  ensureColumn(db, 'users', 'has_defeated_sensei', "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, 'users', 'xp', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'users', 'level', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'users', 'daily_reward_streak', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'users', 'daily_reward_last_claimed_at', 'TEXT');
  ensureColumn(db, 'users', 'spin_wheel_last_spun_at', 'TEXT');
  return db;
}

function ensureColumn(db: Db, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
