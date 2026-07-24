import cors from 'cors';
import express, { type Express } from 'express';
import { config } from './config';
import type { Db } from './db';
import { authRouter } from './routes/auth';
import { cardsRouter } from './routes/cards';
import { catalogRouter } from './routes/catalog';
import { iapRouter } from './routes/iap';
import { leaderboardRouter, matchHistoryRouter } from './routes/leaderboard';
import { packsRouter } from './routes/packs';
import { practiceRouter } from './routes/practice';
import { profileRouter } from './routes/profile';
import { shopRouter } from './routes/shop';

export function createApp(db: Db): Express {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter(db));
  app.use('/me', profileRouter(db));
  app.use('/catalog', catalogRouter(db));
  app.use('/packs', packsRouter(db));
  app.use('/shop', shopRouter(db));
  app.use('/cards', cardsRouter(db));
  app.use('/leaderboard', leaderboardRouter(db));
  app.use('/match-history', matchHistoryRouter(db));
  app.use('/iap', iapRouter(db));
  app.use('/practice', practiceRouter(db));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
