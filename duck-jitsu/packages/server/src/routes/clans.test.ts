import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let leaderToken: string;
let memberToken: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const leader = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'leader@example.com', password: 'hunter22', displayName: 'Leader' });
  leaderToken = leader.body.token;
  const member = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'member@example.com', password: 'hunter22', displayName: 'Member' });
  memberToken = member.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('clans', () => {
  it('creates a clan and makes the creator its leader', async () => {
    const res = await request(ctx.app)
      .post('/clans')
      .set(auth(leaderToken))
      .send({ name: 'Duck Squad', bannerColor: 'blue' });
    expect(res.status).toBe(201);
    expect(res.body.clan.members).toHaveLength(1);
    expect(res.body.clan.members[0].role).toBe('leader');
  });

  it('rejects creating a second clan while already in one', async () => {
    await request(ctx.app).post('/clans').set(auth(leaderToken)).send({ name: 'Duck Squad', bannerColor: 'blue' });
    const res = await request(ctx.app).post('/clans').set(auth(leaderToken)).send({ name: 'Another Clan', bannerColor: 'red' });
    expect(res.status).toBe(409);
  });

  it('lets another player join and shows up in the roster', async () => {
    const created = await request(ctx.app).post('/clans').set(auth(leaderToken)).send({ name: 'Duck Squad', bannerColor: 'blue' });
    const clanId = created.body.clan.id;

    const join = await request(ctx.app).post(`/clans/${clanId}/join`).set(auth(memberToken));
    expect(join.status).toBe(200);
    expect(join.body.clan.members).toHaveLength(2);
  });

  it('promotes the next member to leader when the leader leaves', async () => {
    const created = await request(ctx.app).post('/clans').set(auth(leaderToken)).send({ name: 'Duck Squad', bannerColor: 'blue' });
    const clanId = created.body.clan.id;
    await request(ctx.app).post(`/clans/${clanId}/join`).set(auth(memberToken));

    await request(ctx.app).post('/clans/leave').set(auth(leaderToken));

    const mine = await request(ctx.app).get('/clans/mine').set(auth(memberToken));
    expect(mine.body.clan.members[0].role).toBe('leader');
  });

  it('deletes the clan when the last member leaves', async () => {
    const created = await request(ctx.app).post('/clans').set(auth(leaderToken)).send({ name: 'Duck Squad', bannerColor: 'blue' });
    await request(ctx.app).post('/clans/leave').set(auth(leaderToken));

    const list = await request(ctx.app).get('/clans').set(auth(memberToken));
    expect(list.body.clans.find((c: any) => c.id === created.body.clan.id)).toBeUndefined();
  });
});
