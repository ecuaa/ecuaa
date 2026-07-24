import { randomUUID } from 'node:crypto';
import type { Db } from '../db';

export interface ClanRow {
  id: string;
  name: string;
  banner_color: string;
  description: string;
  leader_id: string;
  created_at: string;
}

export interface ClanMemberRow {
  user_id: string;
  clan_id: string;
  role: string;
  joined_at: string;
}

export class AlreadyInClanError extends Error {
  constructor() {
    super('You are already in a clan');
    this.name = 'AlreadyInClanError';
  }
}

export class ClanNameTakenError extends Error {
  constructor() {
    super('That clan name is already taken');
    this.name = 'ClanNameTakenError';
  }
}

export function getClanMembership(db: Db, userId: string): ClanMemberRow | undefined {
  return db.prepare('SELECT * FROM clan_members WHERE user_id = ?').get(userId) as ClanMemberRow | undefined;
}

export function getClanById(db: Db, id: string): ClanRow | undefined {
  return db.prepare('SELECT * FROM clans WHERE id = ?').get(id) as ClanRow | undefined;
}

export function getClanMembers(db: Db, clanId: string): ClanMemberRow[] {
  return db.prepare('SELECT * FROM clan_members WHERE clan_id = ? ORDER BY joined_at ASC').all(clanId) as ClanMemberRow[];
}

export function listClans(db: Db, limit = 30): (ClanRow & { memberCount: number })[] {
  return db
    .prepare(
      `SELECT c.*, COUNT(m.user_id) as memberCount
       FROM clans c LEFT JOIN clan_members m ON m.clan_id = c.id
       GROUP BY c.id ORDER BY memberCount DESC, c.created_at ASC LIMIT ?`,
    )
    .all(limit) as (ClanRow & { memberCount: number })[];
}

export function createClan(
  db: Db,
  params: { name: string; bannerColor: string; description: string; leaderId: string },
): ClanRow {
  if (getClanMembership(db, params.leaderId)) throw new AlreadyInClanError();
  if (db.prepare('SELECT id FROM clans WHERE name = ?').get(params.name)) throw new ClanNameTakenError();

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO clans (id, name, banner_color, description, leader_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, params.name, params.bannerColor, params.description, params.leaderId, now);
  db.prepare('INSERT INTO clan_members (user_id, clan_id, role, joined_at) VALUES (?, ?, ?, ?)').run(
    params.leaderId,
    id,
    'leader',
    now,
  );
  return getClanById(db, id)!;
}

export function joinClan(db: Db, clanId: string, userId: string): void {
  if (getClanMembership(db, userId)) throw new AlreadyInClanError();
  if (!getClanById(db, clanId)) throw new Error('Clan not found');
  db.prepare('INSERT INTO clan_members (user_id, clan_id, role, joined_at) VALUES (?, ?, ?, ?)').run(
    userId,
    clanId,
    'member',
    new Date().toISOString(),
  );
}

/** Leaving promotes the earliest-joined remaining member to leader, or deletes an emptied clan. */
export function leaveClan(db: Db, userId: string): void {
  const membership = getClanMembership(db, userId);
  if (!membership) return;
  db.prepare('DELETE FROM clan_members WHERE user_id = ?').run(userId);

  if (membership.role === 'leader') {
    const remaining = getClanMembers(db, membership.clan_id);
    if (remaining.length === 0) {
      db.prepare('DELETE FROM clans WHERE id = ?').run(membership.clan_id);
    } else {
      db.prepare('UPDATE clan_members SET role = ? WHERE user_id = ?').run('leader', remaining[0].user_id);
      db.prepare('UPDATE clans SET leader_id = ? WHERE id = ?').run(remaining[0].user_id, membership.clan_id);
    }
  }
}
