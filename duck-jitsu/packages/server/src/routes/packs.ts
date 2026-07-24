import { arenaForTrophies, openPack, PACKS, rarityBand } from '@duck-jitsu/engine';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { grantCard } from '../repo/ownedCards';
import { InsufficientFundsError, getUserById, setStarterPackClaimed, spendCurrency } from '../repo/users';
import { serializeProfile } from '../serialize';

const openPackSchema = z.object({ packId: z.string() });

export function packsRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (_req, res) => {
    // Disclosed drop-rate odds for every purchasable pack, per store policy.
    res.json({ packs: Object.values(PACKS) });
  });

  router.post('/starter/open', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.starter_pack_claimed) {
      res.status(409).json({ error: 'Starter pack already claimed' });
      return;
    }
    const cards = openPack('starter', 0);
    for (const card of cards) grantCard(db, user.id, card.id);
    setStarterPackClaimed(db, user.id);
    const updated = getUserById(db, user.id)!;
    res.json({
      cards: cards.map((c) => ({ ...c, rarityBand: rarityBand(c) })),
      profile: serializeProfile(db, updated),
    });
  });

  router.post('/open', (req, res) => {
    const parsed = openPackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const packDef = PACKS[parsed.data.packId];
    if (!packDef || packDef.id === 'starter') {
      res.status(400).json({ error: 'Unknown or non-purchasable pack id' });
      return;
    }
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (packDef.currency !== 'free') {
      try {
        spendCurrency(db, user.id, packDef.currency, packDef.cost);
      } catch (err) {
        if (err instanceof InsufficientFundsError) {
          res.status(402).json({ error: 'Insufficient currency' });
          return;
        }
        throw err;
      }
    }

    const arena = arenaForTrophies(user.trophies);
    const cards = openPack(packDef.id, arena.tier);
    for (const card of cards) grantCard(db, user.id, card.id);
    const updated = getUserById(db, user.id)!;
    res.json({
      cards: cards.map((c) => ({ ...c, rarityBand: rarityBand(c) })),
      profile: serializeProfile(db, updated),
    });
  });

  return router;
}
