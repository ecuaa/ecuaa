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

  // Hand-rolled instead of the `cors` package: this app is a Bearer-token API (no cookies), so
  // there's no credentials/origin-restriction subtlety to get right -- just always send the
  // header and short-circuit preflight OPTIONS requests.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

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
