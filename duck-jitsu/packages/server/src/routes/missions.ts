import { addXp, generateDailyMissions, MISSION_CATALOG } from '@duck-jitsu/engine';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { todayKey } from '../missionProgress';
import { claimDailyMission, ensureDailyMissions, getDailyMissionRows } from '../repo/dailyMissions';
import { addCurrency, getUserById, setXpAndLevel } from '../repo/users';
import { serializeProfile } from '../serialize';

const claimSchema = z.object({ missionId: z.string() });

function missionsView(db: Db, userId: string) {
  const dateKey = todayKey();
  const defs = generateDailyMissions(dateKey);
  const rows = ensureDailyMissions(db, userId, dateKey, defs.map((m) => m.id));
  const rowById = new Map(rows.map((r) => [r.mission_id, r]));
  return defs.map((def) => {
    const row = rowById.get(def.id)!;
    return {
      id: def.id,
      description: def.description,
      target: def.target,
      progress: Math.min(row.progress, def.target),
      claimed: Boolean(row.claimed),
      reward: def.reward,
    };
  });
}

export function missionsRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/today', (req, res) => {
    res.json({ missions: missionsView(db, req.userId!) });
  });

  router.post('/claim', (req, res) => {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const dateKey = todayKey();
    const def = MISSION_CATALOG.find((m) => m.id === parsed.data.missionId);
    if (!def) {
      res.status(400).json({ error: 'Unknown mission' });
      return;
    }
    const rows = getDailyMissionRows(db, req.userId!, dateKey);
    const row = rows.find((r) => r.mission_id === def.id);
    if (!row) {
      res.status(400).json({ error: 'That mission is not active today' });
      return;
    }
    if (row.claimed) {
      res.status(409).json({ error: 'Already claimed' });
      return;
    }
    if (row.progress < def.target) {
      res.status(400).json({ error: 'Mission not yet complete' });
      return;
    }

    claimDailyMission(db, req.userId!, dateKey, def.id);
    if (def.reward.softCurrency) addCurrency(db, req.userId!, 'soft', def.reward.softCurrency);
    if (def.reward.premiumCurrency) addCurrency(db, req.userId!, 'premium', def.reward.premiumCurrency);
    if (def.reward.xp) {
      const user = getUserById(db, req.userId!)!;
      const next = addXp({ level: user.level, xp: user.xp }, def.reward.xp);
      setXpAndLevel(db, req.userId!, next.xp, next.level);
    }

    const updated = getUserById(db, req.userId!)!;
    res.json({ missions: missionsView(db, req.userId!), profile: serializeProfile(db, updated) });
  });

  return router;
}
