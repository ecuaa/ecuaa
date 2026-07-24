import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { setTrophies } from '../repo/users';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;

async function registerUser(email: string, name: string) {
  const res = await request(ctx.app).post('/auth/register').send({ email, password: 'hunter22', displayName: name });
  return { token: res.body.token, id: res.body.profile.id };
}

beforeEach(() => {
  ctx = makeTestApp();
});

describe('leaderboard', () => {
  it('ranks players by trophies descending', async () => {
    const a = await registerUser('a@example.com', 'Alpha');
    const b = await registerUser('b@example.com', 'Bravo');
    const c = await registerUser('c@example.com', 'Charlie');
    setTrophies(ctx.db, a.id, 500);
    setTrophies(ctx.db, b.id, 1500);
    setTrophies(ctx.db, c.id, 100);

    const res = await request(ctx.app).get('/leaderboard').set('Authorization', `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    const names = res.body.leaderboard.map((e: any) => e.displayName);
    expect(names.slice(0, 3)).toEqual(['Bravo', 'Alpha', 'Charlie']);
    expect(res.body.leaderboard[0].rank).toBe(1);
  });
});

describe('match history', () => {
  it('starts empty for a new player', async () => {
    const a = await registerUser('fresh@example.com', 'Fresh');
    const res = await request(ctx.app).get('/match-history').set('Authorization', `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.history).toEqual([]);
  });

  it('records a practice match result with the winner and reason', async () => {
    const a = await registerUser('historian@example.com', 'Historian');
    const auth = { Authorization: `Bearer ${a.token}` };
    await request(ctx.app).post('/packs/starter/open').set(auth);
    const start = await request(ctx.app).post('/practice/start').set(auth).send({ tutorial: true });
    let matchId = start.body.matchId;
    let highlight = start.body.highlightInstanceId;
    const turn1 = await request(ctx.app).post(`/practice/${matchId}/play`).set(auth).send({ instanceId: highlight });
    highlight = turn1.body.highlightInstanceId;
    await request(ctx.app).post(`/practice/${matchId}/play`).set(auth).send({ instanceId: highlight });

    const history = await request(ctx.app).get('/match-history').set(auth);
    expect(history.body.history.length).toBe(1);
    expect(history.body.history[0].result).toBe('win');
    expect(history.body.history[0].mode).toBe('practice');
  });
});
