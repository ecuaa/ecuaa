import { CARD_COLORS } from '@duck-jitsu/engine';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { getUserById, setTutorialCompleted, updateAvatar } from '../repo/users';
import { serializeProfile } from '../serialize';

const AVATAR_ACCESSORIES = ['none', 'bandana', 'bow', 'headband', 'sunglasses', 'cap'] as const;

const avatarSchema = z.object({
  color: z.enum(CARD_COLORS as unknown as [string, ...string[]]),
  accessory: z.enum(AVATAR_ACCESSORIES),
});

export function profileRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ profile: serializeProfile(db, user) });
  });

  router.patch('/avatar', (req, res) => {
    const parsed = avatarSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    updateAvatar(db, req.userId!, parsed.data.color, parsed.data.accessory);
    const user = getUserById(db, req.userId!)!;
    res.json({ profile: serializeProfile(db, user) });
  });

  router.post('/tutorial-complete', (req, res) => {
    setTutorialCompleted(db, req.userId!);
    const user = getUserById(db, req.userId!)!;
    res.json({ profile: serializeProfile(db, user) });
  });

  return router;
}

export const AVATAR_ACCESSORY_OPTIONS = AVATAR_ACCESSORIES;
