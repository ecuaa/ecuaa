import { claimDailyReward, dailyRewardStatus } from '@duck-jitsu/engine';
import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { addCurrency, getUserById, setDailyRewardState } from '../repo/users';
import { serializeProfile } from '../serialize';

function lastClaimedDate(iso: string | null): Date | null {
  return iso ? new Date(iso) : null;
}

export function dailyRewardRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const status = dailyRewardStatus(user.daily_reward_streak, lastClaimedDate(user.daily_reward_last_claimed_at), new Date());
    res.json({ ...status, streak: user.daily_reward_streak });
  });

  router.post('/claim', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const now = new Date();
    let result;
    try {
      result = claimDailyReward(user.daily_reward_streak, lastClaimedDate(user.daily_reward_last_claimed_at), now);
    } catch {
      res.status(409).json({ error: 'Daily reward is not claimable yet' });
      return;
    }

    setDailyRewardState(db, user.id, result.streakDay, now);
    if (result.reward.softCurrency) addCurrency(db, user.id, 'soft', result.reward.softCurrency);
    if (result.reward.premiumCurrency) addCurrency(db, user.id, 'premium', result.reward.premiumCurrency);

    const updated = getUserById(db, user.id)!;
    res.json({ streakDay: result.streakDay, reward: result.reward, profile: serializeProfile(db, updated) });
  });

  return router;
}
