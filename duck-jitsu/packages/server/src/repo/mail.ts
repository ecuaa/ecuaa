import { randomUUID } from 'node:crypto';
import type { Db } from '../db';

export interface MailRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  reward_soft: number;
  reward_premium: number;
  claimed: number;
  created_at: string;
}

export function getMail(db: Db, userId: string): MailRow[] {
  return db.prepare('SELECT * FROM mail_messages WHERE user_id = ? ORDER BY created_at DESC').all(userId) as MailRow[];
}

export function getMailById(db: Db, id: string, userId: string): MailRow | undefined {
  return db.prepare('SELECT * FROM mail_messages WHERE id = ? AND user_id = ?').get(id, userId) as MailRow | undefined;
}

export function countUnclaimedMail(db: Db, userId: string): number {
  const row = db.prepare('SELECT COUNT(*) as c FROM mail_messages WHERE user_id = ? AND claimed = 0').get(userId) as {
    c: number;
  };
  return row.c;
}

export function sendMail(
  db: Db,
  params: { userId: string; title: string; body: string; rewardSoft?: number; rewardPremium?: number },
): void {
  db.prepare(
    'INSERT INTO mail_messages (id, user_id, title, body, reward_soft, reward_premium, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(randomUUID(), params.userId, params.title, params.body, params.rewardSoft ?? 0, params.rewardPremium ?? 0, new Date().toISOString());
}

export function markMailClaimed(db: Db, id: string): void {
  db.prepare('UPDATE mail_messages SET claimed = 1 WHERE id = ?').run(id);
}
