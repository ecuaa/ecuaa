import {
  ARENAS,
  arenaForTrophies,
  cardsUnlockedUpToArena,
  nextArena,
} from '@duck-jitsu/engine';
import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { getUserById } from '../repo/users';

export function catalogRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  // Only ever returns cards unlocked for *this* player's own arena tier -- locked cards must
  // never be exposed to the client, so the arena tier is derived server-side, never from input.
  router.get('/mine', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const arena = arenaForTrophies(user.trophies);
    res.json({ cards: cardsUnlockedUpToArena(arena.tier) });
  });

  router.get('/arenas', (_req, res) => {
    res.json({
      arenas: ARENAS.map((a) => ({
        tier: a.tier,
        id: a.id,
        name: a.name,
        trophyRequirement: a.trophyRequirement,
        description: a.description,
      })),
    });
  });

  router.get('/arenas/mine', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const arena = arenaForTrophies(user.trophies);
    const next = nextArena(arena.tier);
    const teaserCount = next ? cardsUnlockedUpToArena(next.tier).length - cardsUnlockedUpToArena(arena.tier).length : 0;
    res.json({
      current: arena,
      // Never include next.unlocksCardIds here -- those cards are still locked and must stay
      // hidden until the player actually reaches that arena; only a teaser count is safe.
      next: next
        ? { tier: next.tier, id: next.id, name: next.name, trophyRequirement: next.trophyRequirement, description: next.description, newCardCount: teaserCount }
        : null,
      trophies: user.trophies,
    });
  });

  return router;
}
