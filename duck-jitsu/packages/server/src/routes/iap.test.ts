import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'spender@example.com', password: 'hunter22', displayName: 'Spender' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('iap', () => {
  it('lists products including a one-time remove-ads option', async () => {
    const res = await request(ctx.app).get('/iap/products').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: any) => p.id === 'remove_ads')).toBe(true);
  });

  it('removing ads flips the flag permanently', async () => {
    const res = await request(ctx.app).post('/iap/purchase').set(auth(token)).send({ productId: 'remove_ads' });
    expect(res.status).toBe(200);
    expect(res.body.profile.adsRemoved).toBe(true);
  });

  it('buying a premium currency bundle credits gems', async () => {
    const before = await request(ctx.app).get('/me').set(auth(token));
    const res = await request(ctx.app).post('/iap/purchase').set(auth(token)).send({ productId: 'gems_small' });
    expect(res.status).toBe(200);
    expect(res.body.profile.premiumCurrency).toBe(before.body.profile.premiumCurrency + 80);
  });

  it('rejects an unknown product id', async () => {
    const res = await request(ctx.app).post('/iap/purchase').set(auth(token)).send({ productId: 'nope' });
    expect(res.status).toBe(400);
  });
});
