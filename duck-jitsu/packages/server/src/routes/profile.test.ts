import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'stylish@example.com', password: 'hunter22', displayName: 'Stylish' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('avatar customization', () => {
  it('updates color and accessory', async () => {
    const res = await request(ctx.app)
      .patch('/me/avatar')
      .set(auth(token))
      .send({ color: 'purple', accessory: 'bandana' });
    expect(res.status).toBe(200);
    expect(res.body.profile.avatar).toEqual({ color: 'purple', accessory: 'bandana' });
  });

  it('rejects an invalid color', async () => {
    const res = await request(ctx.app)
      .patch('/me/avatar')
      .set(auth(token))
      .send({ color: 'invisible', accessory: 'bandana' });
    expect(res.status).toBe(400);
  });
});
