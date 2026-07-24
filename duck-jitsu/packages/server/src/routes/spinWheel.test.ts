import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'spinner@example.com', password: 'hunter22', displayName: 'Spinner' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('spin wheel', () => {
  it('is claimable for a brand new player and lists segments', async () => {
    const status = await request(ctx.app).get('/spin-wheel').set(auth(token));
    expect(status.body.claimable).toBe(true);
    expect(status.body.segments.length).toBeGreaterThan(0);
  });

  it('spinning grants a reward and locks the wheel until the cooldown passes', async () => {
    const spin = await request(ctx.app).post('/spin-wheel/spin').set(auth(token));
    expect(spin.status).toBe(200);
    expect(spin.body.segment.id).toBeTruthy();

    const second = await request(ctx.app).post('/spin-wheel/spin').set(auth(token));
    expect(second.status).toBe(409);

    const status = await request(ctx.app).get('/spin-wheel').set(auth(token));
    expect(status.body.claimable).toBe(false);
  });
});
