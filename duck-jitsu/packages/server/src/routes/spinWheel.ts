import { SPIN_WHEEL_SEGMENTS, spinWheel, spinWheelStatus } from '@duck-jitsu/engine';
import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { addCurrency, getUserById, setSpinWheelLastSpunAt } from '../repo/users';
import { serializeProfile } from '../serialize';

function lastSpunDate(iso: string | null): Date | null {
  return iso ? new Date(iso) : null;
}

export function spinWheelRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ segments: SPIN_WHEEL_SEGMENTS, ...spinWheelStatus(lastSpunDate(user.spin_wheel_last_spun_at), new Date()) });
  });

  router.post('/spin', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const now = new Date();
    const status = spinWheelStatus(lastSpunDate(user.spin_wheel_last_spun_at), now);
    if (!status.claimable) {
      res.status(409).json({ error: 'The wheel is not ready to spin yet' });
      return;
    }

    const segment = spinWheel(Math.random);
    setSpinWheelLastSpunAt(db, user.id, now);
    if (segment.reward.softCurrency) addCurrency(db, user.id, 'soft', segment.reward.softCurrency);
    if (segment.reward.premiumCurrency) addCurrency(db, user.id, 'premium', segment.reward.premiumCurrency);

    const updated = getUserById(db, user.id)!;
    res.json({ segment, profile: serializeProfile(db, updated) });
  });

  return router;
}
