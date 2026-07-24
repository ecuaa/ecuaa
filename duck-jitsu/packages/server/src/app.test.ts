import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeTestApp } from './testUtils';

describe('CORS', () => {
  it('sends Access-Control-Allow-Origin on every response, including unauthenticated ones', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/health').set('Origin', 'https://example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('answers preflight OPTIONS requests directly with the CORS headers', async () => {
    const { app } = makeTestApp();
    const res = await request(app)
      .options('/auth/guest')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });
});
