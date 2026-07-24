import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'mailbox@example.com', password: 'hunter22', displayName: 'Mailbox' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('mail', () => {
  it('seeds a welcome mail with a currency reward on account creation', async () => {
    const res = await request(ctx.app).get('/mail').set(auth(token));
    expect(res.body.mail.length).toBeGreaterThan(0);
    expect(res.body.mail.some((m: any) => m.rewardSoft > 0)).toBe(true);
  });

  it('claiming credits the reward and marks the message claimed', async () => {
    const list = await request(ctx.app).get('/mail').set(auth(token));
    const rewardMail = list.body.mail.find((m: any) => m.rewardSoft > 0);

    const before = await request(ctx.app).get('/me').set(auth(token));
    const claim = await request(ctx.app).post(`/mail/${rewardMail.id}/claim`).set(auth(token));
    expect(claim.status).toBe(200);
    expect(claim.body.profile.softCurrency).toBe(before.body.profile.softCurrency + rewardMail.rewardSoft);

    const second = await request(ctx.app).post(`/mail/${rewardMail.id}/claim`).set(auth(token));
    expect(second.status).toBe(409);
  });
});
