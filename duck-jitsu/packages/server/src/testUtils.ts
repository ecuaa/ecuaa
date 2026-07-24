import { createApp } from './app';
import { createDb, type Db } from './db';

export function makeTestApp(): { app: ReturnType<typeof createApp>; db: Db } {
  const db = createDb(':memory:');
  const app = createApp(db);
  return { app, db };
}
