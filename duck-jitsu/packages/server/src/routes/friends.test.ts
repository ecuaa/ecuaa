import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let aToken: string;
let aId: string;
let bToken: string;
let bId: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const a = await request(ctx.app).post('/auth/register').send({ email: 'a@example.com', password: 'hunter22', displayName: 'Alpha' });
  aToken = a.body.token;
  aId = a.body.profile.id;
  const b = await request(ctx.app).post('/auth/register').send({ email: 'b@example.com', password: 'hunter22', displayName: 'Beta' });
  bToken = b.body.token;
  bId = b.body.profile.id;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('friends', () => {
  it('finds another player by display name prefix', async () => {
    const res = await request(ctx.app).get('/friends/search').query({ q: 'Bet' }).set(auth(aToken));
    expect(res.body.results.some((u: any) => u.userId === bId)).toBe(true);
  });

  it('sends a request that shows up as incoming for the target and outgoing for the sender', async () => {
    await request(ctx.app).post('/friends/request').set(auth(aToken)).send({ targetUserId: bId });

    const aView = await request(ctx.app).get('/friends').set(auth(aToken));
    expect(aView.body.outgoing.some((f: any) => f.userId === bId)).toBe(true);

    const bView = await request(ctx.app).get('/friends').set(auth(bToken));
    expect(bView.body.incoming.some((f: any) => f.userId === aId)).toBe(true);
  });

  it('rejects a duplicate request while one is already pending', async () => {
    await request(ctx.app).post('/friends/request').set(auth(aToken)).send({ targetUserId: bId });
    const res = await request(ctx.app).post('/friends/request').set(auth(aToken)).send({ targetUserId: bId });
    expect(res.status).toBe(409);
  });

  it('accepting turns the pending request into a mutual friendship', async () => {
    await request(ctx.app).post('/friends/request').set(auth(aToken)).send({ targetUserId: bId });
    const bView = await request(ctx.app).get('/friends').set(auth(bToken));
    const linkId = bView.body.incoming[0].linkId;

    await request(ctx.app).post(`/friends/${linkId}/accept`).set(auth(bToken));

    const aFriends = await request(ctx.app).get('/friends').set(auth(aToken));
    const bFriends = await request(ctx.app).get('/friends').set(auth(bToken));
    expect(aFriends.body.friends.some((f: any) => f.userId === bId)).toBe(true);
    expect(bFriends.body.friends.some((f: any) => f.userId === aId)).toBe(true);
  });

  it('declining removes the request entirely', async () => {
    await request(ctx.app).post('/friends/request').set(auth(aToken)).send({ targetUserId: bId });
    const bView = await request(ctx.app).get('/friends').set(auth(bToken));
    const linkId = bView.body.incoming[0].linkId;

    await request(ctx.app).post(`/friends/${linkId}/decline`).set(auth(bToken));

    const bAfter = await request(ctx.app).get('/friends').set(auth(bToken));
    expect(bAfter.body.incoming).toHaveLength(0);
    expect(bAfter.body.friends).toHaveLength(0);
  });
});
