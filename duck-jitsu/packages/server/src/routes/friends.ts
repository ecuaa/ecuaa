import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import {
  AlreadyFriendsOrPendingError,
  getAcceptedFriendLinks,
  getPendingIncoming,
  getPendingOutgoing,
  removeFriendLink,
  respondToFriendRequest,
  sendFriendRequest,
} from '../repo/friends';
import { findUsersByNamePrefix, getUserById } from '../repo/users';

const requestSchema = z.object({ targetUserId: z.string() });
const searchSchema = z.object({ q: z.string().trim().min(1).max(40) });

function otherSide(link: { requester_id: string; addressee_id: string }, myId: string): string {
  return link.requester_id === myId ? link.addressee_id : link.requester_id;
}

function userSummary(db: Db, id: string) {
  const user = getUserById(db, id);
  return user
    ? { userId: user.id, displayName: user.display_name, trophies: user.trophies, avatar: { color: user.avatar_color, accessory: user.avatar_accessory } }
    : { userId: id, displayName: 'Unknown Duck', trophies: 0, avatar: { color: 'yellow', accessory: 'none' } };
}

export function friendsRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const friends = getAcceptedFriendLinks(db, req.userId!).map((link) => ({
      linkId: link.id,
      ...userSummary(db, otherSide(link, req.userId!)),
    }));
    const incoming = getPendingIncoming(db, req.userId!).map((link) => ({
      linkId: link.id,
      ...userSummary(db, link.requester_id),
    }));
    const outgoing = getPendingOutgoing(db, req.userId!).map((link) => ({
      linkId: link.id,
      ...userSummary(db, link.addressee_id),
    }));
    res.json({ friends, incoming, outgoing });
  });

  router.get('/search', (req, res) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const results = findUsersByNamePrefix(db, parsed.data.q, req.userId!).map((u) => ({
      userId: u.id,
      displayName: u.display_name,
      trophies: u.trophies,
    }));
    res.json({ results });
  });

  router.post('/request', (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      sendFriendRequest(db, req.userId!, parsed.data.targetUserId);
    } catch (err) {
      if (err instanceof AlreadyFriendsOrPendingError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not send request' });
      return;
    }
    res.status(201).json({ ok: true });
  });

  router.post('/:linkId/accept', (req, res) => {
    try {
      respondToFriendRequest(db, req.params.linkId, req.userId!, true);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not accept request' });
      return;
    }
    res.json({ ok: true });
  });

  router.post('/:linkId/decline', (req, res) => {
    try {
      respondToFriendRequest(db, req.params.linkId, req.userId!, false);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not decline request' });
      return;
    }
    res.json({ ok: true });
  });

  router.delete('/:linkId', (req, res) => {
    removeFriendLink(db, req.params.linkId, req.userId!);
    res.json({ ok: true });
  });

  return router;
}
