import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'reward@example.com', password: 'hunter22', displayName: 'Rewardee' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('daily reward', () => {
  it('is claimable for a brand new player', async () => {
    const status = await request(ctx.app).get('/daily-reward').set(auth(token));
    expect(status.body.claimable).toBe(true);
  });

  it('credits currency and starts the streak at day 1 on first claim', async () => {
    const before = await request(ctx.app).get('/me').set(auth(token));
    const claim = await request(ctx.app).post('/daily-reward/claim').set(auth(token));
    expect(claim.status).toBe(200);
    expect(claim.body.streakDay).toBe(1);
    expect(claim.body.profile.softCurrency).toBeGreaterThan(before.body.profile.softCurrency);
  });

  it('cannot be claimed twice in a row', async () => {
    await request(ctx.app).post('/daily-reward/claim').set(auth(token));
    const second = await request(ctx.app).post('/daily-reward/claim').set(auth(token));
    expect(second.status).toBe(409);
  });
});
