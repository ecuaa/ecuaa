import { randomUUID } from 'node:crypto';
import type { Db } from '../db';

export interface FriendLinkRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

export class AlreadyFriendsOrPendingError extends Error {
  constructor() {
    super('Already friends, or a request is already pending');
    this.name = 'AlreadyFriendsOrPendingError';
  }
}

export function getFriendLinkBetween(db: Db, a: string, b: string): FriendLinkRow | undefined {
  return db
    .prepare(
      'SELECT * FROM friend_links WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
    )
    .get(a, b, b, a) as FriendLinkRow | undefined;
}

export function sendFriendRequest(db: Db, requesterId: string, addresseeId: string): void {
  if (requesterId === addresseeId) throw new Error('Cannot friend yourself');
  if (getFriendLinkBetween(db, requesterId, addresseeId)) throw new AlreadyFriendsOrPendingError();
  db.prepare('INSERT INTO friend_links (id, requester_id, addressee_id, status, created_at) VALUES (?, ?, ?, ?, ?)').run(
    randomUUID(),
    requesterId,
    addresseeId,
    'pending',
    new Date().toISOString(),
  );
}

export function respondToFriendRequest(db: Db, linkId: string, userId: string, accept: boolean): void {
  const link = db.prepare('SELECT * FROM friend_links WHERE id = ?').get(linkId) as FriendLinkRow | undefined;
  if (!link || link.addressee_id !== userId || link.status !== 'pending') {
    throw new Error('No pending request found');
  }
  if (accept) {
    db.prepare("UPDATE friend_links SET status = 'accepted' WHERE id = ?").run(linkId);
  } else {
    db.prepare('DELETE FROM friend_links WHERE id = ?').run(linkId);
  }
}

export function removeFriendLink(db: Db, linkId: string, userId: string): void {
  const link = db.prepare('SELECT * FROM friend_links WHERE id = ?').get(linkId) as FriendLinkRow | undefined;
  if (!link || (link.requester_id !== userId && link.addressee_id !== userId)) return;
  db.prepare('DELETE FROM friend_links WHERE id = ?').run(linkId);
}

export function getAcceptedFriendLinks(db: Db, userId: string): FriendLinkRow[] {
  return db
    .prepare("SELECT * FROM friend_links WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'")
    .all(userId, userId) as FriendLinkRow[];
}

export function getPendingIncoming(db: Db, userId: string): FriendLinkRow[] {
  return db.prepare("SELECT * FROM friend_links WHERE addressee_id = ? AND status = 'pending'").all(userId) as FriendLinkRow[];
}

export function getPendingOutgoing(db: Db, userId: string): FriendLinkRow[] {
  return db.prepare("SELECT * FROM friend_links WHERE requester_id = ? AND status = 'pending'").all(userId) as FriendLinkRow[];
}

export function countPendingIncoming(db: Db, userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM friend_links WHERE addressee_id = ? AND status = 'pending'")
    .get(userId) as { c: number };
  return row.c;
}
