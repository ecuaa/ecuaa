import { Router } from 'express';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { getMailById, getMail, markMailClaimed } from '../repo/mail';
import { addCurrency, getUserById } from '../repo/users';
import { serializeProfile } from '../serialize';

function mailView(rows: ReturnType<typeof getMail>) {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    rewardSoft: r.reward_soft,
    rewardPremium: r.reward_premium,
    claimed: Boolean(r.claimed),
    createdAt: r.created_at,
  }));
}

export function mailRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    res.json({ mail: mailView(getMail(db, req.userId!)) });
  });

  router.post('/:mailId/claim', (req, res) => {
    const message = getMailById(db, req.params.mailId, req.userId!);
    if (!message) {
      res.status(404).json({ error: 'Mail not found' });
      return;
    }
    if (message.claimed) {
      res.status(409).json({ error: 'Already claimed' });
      return;
    }
    markMailClaimed(db, message.id);
    if (message.reward_soft) addCurrency(db, req.userId!, 'soft', message.reward_soft);
    if (message.reward_premium) addCurrency(db, req.userId!, 'premium', message.reward_premium);

    const updated = getUserById(db, req.userId!)!;
    res.json({ mail: mailView(getMail(db, req.userId!)), profile: serializeProfile(db, updated) });
  });

  return router;
}
