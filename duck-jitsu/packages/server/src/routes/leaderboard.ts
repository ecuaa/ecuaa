import { arenaForTrophies } from '@duck-jitsu/engine';
import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { getMatchHistory } from '../repo/matches';
import { topByTrophies } from '../repo/users';

export function leaderboardRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const top = topByTrophies(db, limit);
    res.json({
      leaderboard: top.map((u, index) => ({
        rank: index + 1,
        displayName: u.display_name,
        trophies: u.trophies,
        arena: arenaForTrophies(u.trophies).name,
        avatar: { color: u.avatar_color, accessory: u.avatar_accessory },
      })),
    });
  });

  return router;
}

export function matchHistoryRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    res.json({ history: getMatchHistory(db, req.userId!, limit) });
  });

  return router;
}
