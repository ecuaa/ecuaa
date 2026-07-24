import { applyLevelUp, arenaForTrophies, getCardDef, tryLevelUp } from '@duck-jitsu/engine';
import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { getOwnedCard, setCardProgress } from '../repo/ownedCards';
import { getUserById } from '../repo/users';
import { serializeProfile } from '../serialize';

export function cardsRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/:cardId/level-up', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const owned = getOwnedCard(db, user.id, req.params.cardId);
    if (!owned) {
      res.status(404).json({ error: 'You do not own this card' });
      return;
    }
    let cardDef;
    try {
      cardDef = getCardDef(req.params.cardId);
    } catch {
      res.status(404).json({ error: 'Unknown card' });
      return;
    }
    const arena = arenaForTrophies(user.trophies);
    const result = tryLevelUp(owned, cardDef, arena.tier);
    if (!result.canLevelUp) {
      res.status(400).json({ error: result.reason ?? 'Cannot level up', ...result });
      return;
    }
    const updatedOwned = applyLevelUp(owned, result);
    setCardProgress(db, user.id, cardDef.id, updatedOwned.level, updatedOwned.duplicates);
    res.json({ profile: serializeProfile(db, user) });
  });

  return router;
}
