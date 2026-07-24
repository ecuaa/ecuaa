import type { Db } from '../db';

export interface UserRow {
  id: string;
  email: string | null;
  password_hash: string | null;
  is_guest: number;
  display_name: string;
  avatar_color: string;
  avatar_accessory: string;
  soft_currency: number;
  premium_currency: number;
  trophies: number;
  ads_removed: number;
  starter_pack_claimed: number;
  tutorial_completed: number;
  has_defeated_sensei: number;
  created_at: string;
}

const STARTING_SOFT_CURRENCY = 500;
const STARTING_PREMIUM_CURRENCY = 20;

export function createUser(
  db: Db,
  params: {
    id: string;
    email: string | null;
    passwordHash: string | null;
    isGuest: boolean;
    displayName: string;
  },
): UserRow {
  db.prepare(
    `INSERT INTO users (id, email, password_hash, is_guest, display_name, soft_currency, premium_currency, created_at)
     VALUES (@id, @email, @passwordHash, @isGuest, @displayName, @softCurrency, @premiumCurrency, @createdAt)`,
  ).run({
    id: params.id,
    email: params.email,
    passwordHash: params.passwordHash,
    isGuest: params.isGuest ? 1 : 0,
    displayName: params.displayName,
    softCurrency: STARTING_SOFT_CURRENCY,
    premiumCurrency: STARTING_PREMIUM_CURRENCY,
    createdAt: new Date().toISOString(),
  });
  return getUserById(db, params.id)!;
}

export function getUserById(db: Db, id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function getUserByEmail(db: Db, email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function updateAvatar(db: Db, id: string, color: string, accessory: string): void {
  db.prepare('UPDATE users SET avatar_color = ?, avatar_accessory = ? WHERE id = ?').run(
    color,
    accessory,
    id,
  );
}

export function setStarterPackClaimed(db: Db, id: string): void {
  db.prepare('UPDATE users SET starter_pack_claimed = 1 WHERE id = ?').run(id);
}

export function setTutorialCompleted(db: Db, id: string): void {
  db.prepare('UPDATE users SET tutorial_completed = 1 WHERE id = ?').run(id);
}

export function setAdsRemoved(db: Db, id: string): void {
  db.prepare('UPDATE users SET ads_removed = 1 WHERE id = ?').run(id);
}

/** Permanently records a Sensei victory. This is the only way a player ever earns the Black Belt. */
export function setDefeatedSensei(db: Db, id: string): void {
  db.prepare('UPDATE users SET has_defeated_sensei = 1 WHERE id = ?').run(id);
}

export function setTrophies(db: Db, id: string, trophies: number): void {
  db.prepare('UPDATE users SET trophies = ? WHERE id = ?').run(Math.max(0, trophies), id);
}

export class InsufficientFundsError extends Error {
  constructor() {
    super('Insufficient currency');
    this.name = 'InsufficientFundsError';
  }
}

export function addCurrency(
  db: Db,
  id: string,
  currency: 'soft' | 'premium',
  amount: number,
): void {
  const column = currency === 'soft' ? 'soft_currency' : 'premium_currency';
  db.prepare(`UPDATE users SET ${column} = ${column} + ? WHERE id = ?`).run(amount, id);
}

/** Throws InsufficientFundsError and makes no changes if the user can't afford `amount`. */
export function spendCurrency(
  db: Db,
  id: string,
  currency: 'soft' | 'premium',
  amount: number,
): void {
  const column = currency === 'soft' ? 'soft_currency' : 'premium_currency';
  const result = db
    .prepare(`UPDATE users SET ${column} = ${column} - ? WHERE id = ? AND ${column} >= ?`)
    .run(amount, id, amount);
  if (result.changes === 0) {
    throw new InsufficientFundsError();
  }
}

export function topByTrophies(db: Db, limit: number): UserRow[] {
  return db
    .prepare('SELECT * FROM users ORDER BY trophies DESC, display_name ASC LIMIT ?')
    .all(limit) as UserRow[];
}
