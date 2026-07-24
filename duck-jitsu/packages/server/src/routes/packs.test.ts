import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'packer@example.com', password: 'hunter22', displayName: 'Packer' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('starter pack', () => {
  it('grants the fixed starter set exactly once', async () => {
    const res = await request(ctx.app).post('/packs/starter/open').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.cards.length).toBeGreaterThan(0);
    expect(res.body.profile.ownedCards.length).toBe(res.body.cards.length);

    const again = await request(ctx.app).post('/packs/starter/open').set(auth(token));
    expect(again.status).toBe(409);
  });
});

describe('paid packs', () => {
  it('deducts currency and never returns a locked card', async () => {
    const before = await request(ctx.app).get('/me').set(auth(token));
    const startingGold = before.body.profile.softCurrency;

    const res = await request(ctx.app).post('/packs/open').set(auth(token)).send({ packId: 'basic' });
    expect(res.status).toBe(200);
    for (const card of res.body.cards) {
      expect(card.unlockArena).toBe(0); // fresh account is still arena 0
    }
    expect(res.body.profile.softCurrency).toBeLessThan(startingGold);
  });

  it('refuses to open a pack you cannot afford', async () => {
    // Spend it all down with repeated basic pack purchases until broke, then try once more.
    for (let i = 0; i < 20; i++) {
      const r = await request(ctx.app).post('/packs/open').set(auth(token)).send({ packId: 'basic' });
      if (r.status === 402) {
        expect(r.body.error).toBeTruthy();
        return;
      }
    }
    throw new Error('Expected to eventually run out of soft currency');
  });

  it('rejects an unknown pack id', async () => {
    const res = await request(ctx.app).post('/packs/open').set(auth(token)).send({ packId: 'nope' });
    expect(res.status).toBe(400);
  });
});
