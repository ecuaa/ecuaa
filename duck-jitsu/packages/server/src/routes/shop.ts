import { arenaForTrophies, getShopOffers } from '@duck-jitsu/engine';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { bumpMissionsOfType } from '../missionProgress';
import { getOwnedCards, grantCard } from '../repo/ownedCards';
import { InsufficientFundsError, addCurrency, getUserById, spendCurrency } from '../repo/users';
import { serializeProfile } from '../serialize';

const purchaseSchema = z.object({ offerId: z.string() });

export function shopRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/offers', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const arena = arenaForTrophies(user.trophies);
    const owned = new Set(getOwnedCards(db, user.id).map((c) => c.cardId));
    const offers = getShopOffers(user.id, arena.tier, owned);
    res.json({ offers, refreshesInHours: 24 });
  });

  router.post('/purchase', (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const arena = arenaForTrophies(user.trophies);
    const owned = new Set(getOwnedCards(db, user.id).map((c) => c.cardId));
    // Recompute today's offers server-side -- never trust a client-supplied offer payload.
    const todaysOffers = getShopOffers(user.id, arena.tier, owned);
    const offer = todaysOffers.find((o) => o.id === parsed.data.offerId);
    if (!offer) {
      res.status(400).json({ error: 'That offer is not currently available' });
      return;
    }

    if (offer.kind === 'currency_bundle') {
      // Mock real-money purchase stub: a production build would validate an Apple/Google
      // purchase receipt here before crediting currency.
      addCurrency(db, user.id, offer.currency, offer.quantity ?? 0);
    } else {
      try {
        spendCurrency(db, user.id, offer.currency, offer.price);
      } catch (err) {
        if (err instanceof InsufficientFundsError) {
          res.status(402).json({ error: 'Insufficient currency' });
          return;
        }
        throw err;
      }
      if (offer.kind === 'card' && offer.cardId) {
        grantCard(db, user.id, offer.cardId);
      } else if (offer.kind === 'duplicate_bundle' && offer.cardId) {
        for (let i = 0; i < (offer.quantity ?? 1); i++) grantCard(db, user.id, offer.cardId);
      }
    }

    bumpMissionsOfType(db, user.id, 'purchase_shop_offer');
    const updated = getUserById(db, user.id)!;
    res.json({ profile: serializeProfile(db, updated) });
  });

  return router;
}
