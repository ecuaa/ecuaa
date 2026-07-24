import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import {
  AlreadyInClanError,
  ClanNameTakenError,
  createClan,
  getClanById,
  getClanMembers,
  getClanMembership,
  joinClan,
  leaveClan,
  listClans,
} from '../repo/clans';
import { getUserById } from '../repo/users';

const BANNER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const;

const createSchema = z.object({
  name: z.string().trim().min(3).max(24),
  bannerColor: z.enum(BANNER_COLORS),
  description: z.string().trim().max(200).optional(),
});

function memberView(db: Db, clanId: string) {
  return getClanMembers(db, clanId).map((m) => {
    const user = getUserById(db, m.user_id);
    return {
      userId: m.user_id,
      displayName: user?.display_name ?? 'Unknown Duck',
      role: m.role,
      trophies: user?.trophies ?? 0,
      joinedAt: m.joined_at,
    };
  });
}

function clanView(db: Db, clan: ReturnType<typeof getClanById>) {
  if (!clan) return null;
  return {
    id: clan.id,
    name: clan.name,
    bannerColor: clan.banner_color,
    description: clan.description,
    leaderId: clan.leader_id,
    members: memberView(db, clan.id),
  };
}

export function clansRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (_req, res) => {
    res.json({ clans: listClans(db).map((c) => ({ id: c.id, name: c.name, bannerColor: c.banner_color, description: c.description, memberCount: c.memberCount })) });
  });

  router.get('/mine', (req, res) => {
    const membership = getClanMembership(db, req.userId!);
    if (!membership) {
      res.json({ clan: null });
      return;
    }
    res.json({ clan: clanView(db, getClanById(db, membership.clan_id)) });
  });

  router.post('/', (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const clan = createClan(db, {
        name: parsed.data.name,
        bannerColor: parsed.data.bannerColor,
        description: parsed.data.description ?? '',
        leaderId: req.userId!,
      });
      res.status(201).json({ clan: clanView(db, clan) });
    } catch (err) {
      if (err instanceof AlreadyInClanError || err instanceof ClanNameTakenError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.post('/:clanId/join', (req, res) => {
    try {
      joinClan(db, req.params.clanId, req.userId!);
    } catch (err) {
      if (err instanceof AlreadyInClanError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not join clan' });
      return;
    }
    const membership = getClanMembership(db, req.userId!)!;
    res.json({ clan: clanView(db, getClanById(db, membership.clan_id)) });
  });

  router.post('/leave', (req, res) => {
    leaveClan(db, req.userId!);
    res.json({ clan: null });
  });

  return router;
}
