import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
beforeEach(() => {
  ctx = makeTestApp();
});

describe('auth', () => {
  it('registers, grants starting currency, and returns a usable token', async () => {
    const res = await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'hunter22', displayName: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.profile.softCurrency).toBeGreaterThan(0);
    expect(res.body.profile.arena.tier).toBe(0);

    const me = await request(ctx.app).get('/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.profile.displayName).toBe('Alice');
  });

  it('rejects duplicate email registration', async () => {
    await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'hunter22', displayName: 'Dup' });
    const res = await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'hunter22', displayName: 'Dup2' });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'bob@example.com', password: 'correcthorse', displayName: 'Bob' });

    const good = await request(ctx.app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'correcthorse' });
    expect(good.status).toBe(200);

    const bad = await request(ctx.app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'wrongpassword' });
    expect(bad.status).toBe(401);
  });

  it('creates a guest account with no email required', async () => {
    const res = await request(ctx.app).post('/auth/guest').send({});
    expect(res.status).toBe(201);
    expect(res.body.profile.isGuest).toBe(true);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await request(ctx.app).get('/me');
    expect(res.status).toBe(401);
  });
});
