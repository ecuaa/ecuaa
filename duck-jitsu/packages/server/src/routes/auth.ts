import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Db } from '../db';
import { requireAuth, signToken } from '../auth';
import { sendMail } from '../repo/mail';
import { createUser, getUserByEmail, getUserById } from '../repo/users';
import { serializeProfile } from '../serialize';

function sendWelcomeMail(db: Db, userId: string): void {
  sendMail(db, {
    userId,
    title: 'Welcome to the Dojo!',
    body: "A gift from the Sensei to get you started on your Duck Jitsu journey.",
    rewardSoft: 100,
    rewardPremium: 10,
  });
  sendMail(db, {
    userId,
    title: 'Daily Rewards Await',
    body: 'Check in every day for a login bonus, and spin the wheel for a bonus prize!',
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(24),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const guestSchema = z.object({
  displayName: z.string().min(1).max(24).optional(),
});

export function authRouter(db: Db): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { email, password, displayName } = parsed.data;
    if (getUserByEmail(db, email)) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(db, {
      id: randomUUID(),
      email,
      passwordHash,
      isGuest: false,
      displayName,
    });
    sendWelcomeMail(db, user.id);
    res.status(201).json({ token: signToken(user.id), profile: serializeProfile(db, user) });
  });

  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { email, password } = parsed.data;
    const user = getUserByEmail(db, email);
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json({ token: signToken(user.id), profile: serializeProfile(db, user) });
  });

  router.post('/guest', (req, res) => {
    const parsed = guestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const id = randomUUID();
    const user = createUser(db, {
      id,
      email: null,
      passwordHash: null,
      isGuest: true,
      displayName: parsed.data.displayName ?? `Guest Duck ${id.slice(0, 4)}`,
    });
    sendWelcomeMail(db, user.id);
    res.status(201).json({ token: signToken(user.id), profile: serializeProfile(db, user) });
  });

  router.get('/me', requireAuth, (req, res) => {
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ profile: serializeProfile(db, user) });
  });

  return router;
}
