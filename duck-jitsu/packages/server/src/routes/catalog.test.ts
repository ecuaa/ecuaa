import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'newbie@example.com', password: 'hunter22', displayName: 'Newbie' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('catalog', () => {
  it('only exposes arena-0 cards to a brand new player, ignoring any client-supplied tier', async () => {
    const res = await request(ctx.app).get('/catalog/mine?arenaTier=7').set(auth(token));
    expect(res.status).toBe(200);
    for (const card of res.body.cards) {
      expect(card.unlockArena).toBe(0);
    }
  });

  it('lists arenas and a next-arena teaser without leaking locked card details', async () => {
    const res = await request(ctx.app).get('/catalog/arenas/mine').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.current.tier).toBe(0);
    expect(res.body.next.tier).toBe(1);
    expect(typeof res.body.next.newCardCount).toBe('number');
    expect(res.body.next.newCardCount).toBeGreaterThan(0);
    // The next arena's cards are still locked -- must never be included, only a teaser count.
    expect(res.body.next.unlocksCardIds).toBeUndefined();
  });
});
