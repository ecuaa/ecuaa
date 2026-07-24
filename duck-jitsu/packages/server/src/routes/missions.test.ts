import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'missions@example.com', password: 'hunter22', displayName: 'Missioner' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('missions', () => {
  it('always hands back exactly 3 missions for today, stable across calls', async () => {
    const first = await request(ctx.app).get('/missions/today').set(auth(token));
    const second = await request(ctx.app).get('/missions/today').set(auth(token));
    expect(first.body.missions).toHaveLength(3);
    expect(first.body.missions.map((m: any) => m.id)).toEqual(second.body.missions.map((m: any) => m.id));
  });

  it('progresses the open_packs mission when a pack is opened', async () => {
    const before = await request(ctx.app).get('/missions/today').set(auth(token));
    const openMission = before.body.missions.find((m: any) => m.id.startsWith('open-'));
    expect(openMission).toBeTruthy();

    await request(ctx.app).post('/packs/starter/open').set(auth(token));

    const after = await request(ctx.app).get('/missions/today').set(auth(token));
    const updated = after.body.missions.find((m: any) => m.id === openMission.id);
    expect(updated.progress).toBeGreaterThan(openMission.progress);
  });

  it('rejects claiming an incomplete mission', async () => {
    const list = await request(ctx.app).get('/missions/today').set(auth(token));
    const mission = list.body.missions[0];
    const res = await request(ctx.app).post('/missions/claim').set(auth(token)).send({ missionId: mission.id });
    expect(res.status).toBe(400);
  });

  it('pays out the reward when a mission is completed and claimed', async () => {
    const list = await request(ctx.app).get('/missions/today').set(auth(token));
    const openMission = list.body.missions.find((m: any) => m.id.startsWith('open-'));
    expect(openMission).toBeTruthy();

    // Open enough packs (starter once, then purchased basic packs) to hit the mission's target.
    await request(ctx.app).post('/packs/starter/open').set(auth(token));
    for (let i = 1; i < openMission.target; i++) {
      await request(ctx.app).post('/packs/open').set(auth(token)).send({ packId: 'basic' });
    }

    const before = await request(ctx.app).get('/me').set(auth(token));
    const claim = await request(ctx.app).post('/missions/claim').set(auth(token)).send({ missionId: openMission.id });
    expect(claim.status).toBe(200);
    const gainedSoft = claim.body.profile.softCurrency - before.body.profile.softCurrency;
    const gainedPremium = claim.body.profile.premiumCurrency - before.body.profile.premiumCurrency;
    expect(gainedSoft + gainedPremium).toBeGreaterThan(0);

    const secondClaim = await request(ctx.app).post('/missions/claim').set(auth(token)).send({ missionId: openMission.id });
    expect(secondClaim.status).toBe(409);
  });
});
