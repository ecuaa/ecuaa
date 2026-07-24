import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { createDb, type Db } from '../db';
import { attachRealtime } from './index';

let db: Db;
let httpServer: ReturnType<typeof createServer>;
let baseUrl: string;
let clients: ClientSocket[] = [];

async function registerAndOpenStarter(app: ReturnType<typeof createApp>, email: string, name: string) {
  const res = await request(app).post('/auth/register').send({ email, password: 'hunter22', displayName: name });
  const token = res.body.token as string;
  await request(app).post('/packs/starter/open').set('Authorization', `Bearer ${token}`);
  return { token, userId: res.body.profile.id as string };
}

function connectClient(token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { auth: { token }, transports: ['websocket'] });
    clients.push(socket);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

beforeEach(async () => {
  db = createDb(':memory:');
  const app = createApp(db);
  httpServer = createServer(app);
  attachRealtime(httpServer, db);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${address.port}`;
});

afterEach(async () => {
  for (const c of clients) c.close();
  clients = [];
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

describe('casual PvP matchmaking + battle', () => {
  it('pairs two queued players and plays a full match to completion', async () => {
    const app = createApp(db); // separate app instance purely for REST setup calls (shares db)
    const p1 = await registerAndOpenStarter(app, 'p1@example.com', 'PlayerOne');
    const p2 = await registerAndOpenStarter(app, 'p2@example.com', 'PlayerTwo');

    const s1 = await connectClient(p1.token);
    const s2 = await connectClient(p2.token);

    const start1 = new Promise<any>((resolve) => s1.once('match:start', resolve));
    const start2 = new Promise<any>((resolve) => s2.once('match:start', resolve));

    s1.emit('queue:join', { mode: 'casual' });
    s2.emit('queue:join', { mode: 'casual' });

    const [m1, m2] = await Promise.all([start1, start2]);
    expect(m1.matchId).toBe(m2.matchId);
    expect(m1.opponent.name).toBe('PlayerTwo');
    expect(m2.opponent.name).toBe('PlayerOne');

    let view1 = m1.view;
    let view2 = m2.view;
    let guard = 0;
    while (view1.status !== 'finished' && guard < 60) {
      const end1 = new Promise<any>((resolve) => s1.once('match:turn-result', resolve));
      const end2 = new Promise<any>((resolve) => s2.once('match:turn-result', resolve));
      s1.emit('match:play', { matchId: m1.matchId, instanceId: view1.you.hand[0].instanceId });
      s2.emit('match:play', { matchId: m1.matchId, instanceId: view2.you.hand[0].instanceId });
      const [r1, r2] = await Promise.all([end1, end2]);
      view1 = r1.view;
      view2 = r2.view;
      guard++;
    }

    expect(view1.status).toBe('finished');
    expect(['you', 'opponent', 'draw']).toContain(view1.winner);
  }, 15000);

  it('declares the remaining player the winner if the opponent disconnects mid-match', async () => {
    const app = createApp(db);
    const p1 = await registerAndOpenStarter(app, 'd1@example.com', 'Stayer');
    const p2 = await registerAndOpenStarter(app, 'd2@example.com', 'Leaver');

    const s1 = await connectClient(p1.token);
    const s2 = await connectClient(p2.token);

    const start1 = new Promise<any>((resolve) => s1.once('match:start', resolve));
    const start2 = new Promise<any>((resolve) => s2.once('match:start', resolve));
    s1.emit('queue:join', { mode: 'casual' });
    s2.emit('queue:join', { mode: 'casual' });
    await Promise.all([start1, start2]);

    const end1 = new Promise<any>((resolve) => s1.once('match:end', resolve));
    s2.close();
    const outcome = await end1;
    expect(outcome.winner).toBe('you');
  }, 15000);
});
