import { createServer } from 'node:http';
import { createApp } from './app';
import { config } from './config';
import { createDb } from './db';
import { attachRealtime } from './realtime';

const db = createDb(config.dbPath);
const app = createApp(db);
const httpServer = createServer(app);
attachRealtime(httpServer, db);

httpServer.listen(config.port, () => {
  console.log(`Duck Jitsu server listening on port ${config.port}`);
});
