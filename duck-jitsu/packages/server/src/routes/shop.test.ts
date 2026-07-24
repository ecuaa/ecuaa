import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'shopper@example.com', password: 'hunter22', displayName: 'Shopper' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('shop', () => {
  it('only offers cards the player has not opened yet', async () => {
    await request(ctx.app).post('/packs/starter/open').set(auth(token));
    const offersRes = await request(ctx.app).get('/shop/offers').set(auth(token));
    expect(offersRes.status).toBe(200);
    const cardOffers = offersRes.body.offers.filter((o: any) => o.kind === 'card');
    const me = await request(ctx.app).get('/me').set(auth(token));
    const ownedIds = new Set(me.body.profile.ownedCards.map((c: any) => c.cardId));
    for (const offer of cardOffers) {
      expect(ownedIds.has(offer.cardId)).toBe(false);
    }
  });

  it('purchasing a card offer spends currency and grants the card', async () => {
    const offersRes = await request(ctx.app).get('/shop/offers').set(auth(token));
    const cardOffer = offersRes.body.offers.find((o: any) => o.kind === 'card');
    expect(cardOffer).toBeTruthy();

    const before = await request(ctx.app).get('/me').set(auth(token));
    const purchase = await request(ctx.app)
      .post('/shop/purchase')
      .set(auth(token))
      .send({ offerId: cardOffer.id });
    expect(purchase.status).toBe(200);
    expect(purchase.body.profile.softCurrency).toBe(before.body.profile.softCurrency - cardOffer.price);
    expect(purchase.body.profile.ownedCards.some((c: any) => c.cardId === cardOffer.cardId)).toBe(true);
  });

  it('rejects purchasing an offer id that is not in today\'s rotation', async () => {
    const res = await request(ctx.app)
      .post('/shop/purchase')
      .set(auth(token))
      .send({ offerId: 'card:totally-made-up' });
    expect(res.status).toBe(400);
  });
});
