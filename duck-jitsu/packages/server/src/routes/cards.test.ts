import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { setCardProgress } from '../repo/ownedCards';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'leveler@example.com', password: 'hunter22', displayName: 'Leveler' });
  token = res.body.token;
  await request(ctx.app).post('/packs/starter/open').set('Authorization', `Bearer ${token}`);
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('level-up', () => {
  it('refuses to level up without enough duplicates', async () => {
    const me = await request(ctx.app).get('/me').set(auth(token));
    const cardId = me.body.profile.ownedCards[0].cardId;
    const res = await request(ctx.app).post(`/cards/${cardId}/level-up`).set(auth(token));
    expect(res.status).toBe(400);
    expect(res.body.reason).toBe('not-enough-duplicates');
  });

  it('levels up once enough duplicates are available', async () => {
    const me = await request(ctx.app).get('/me').set(auth(token));
    const cardId = me.body.profile.ownedCards[0].cardId;
    const userId = me.body.profile.id;

    // Directly grant the duplicates needed (level 1 -> 2 costs 2 duplicates) rather than relying
    // on random pack rolls, so this test is deterministic.
    setCardProgress(ctx.db, userId, cardId, 1, 2);

    const res = await request(ctx.app).post(`/cards/${cardId}/level-up`).set(auth(token));
    expect(res.status).toBe(200);
    const updatedCard = res.body.profile.ownedCards.find((c: any) => c.cardId === cardId);
    expect(updatedCard.level).toBe(2);
    expect(updatedCard.duplicates).toBe(0);
  });

  it('404s for a card you do not own', async () => {
    const res = await request(ctx.app).post('/cards/water-blue-t0-0-does-not-own/level-up').set(auth(token));
    expect(res.status).toBe(404);
  });
});
