import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeTestApp } from '../testUtils';

let ctx: ReturnType<typeof makeTestApp>;
let token: string;

beforeEach(async () => {
  ctx = makeTestApp();
  const res = await request(ctx.app)
    .post('/auth/register')
    .send({ email: 'trainee@example.com', password: 'hunter22', displayName: 'Trainee' });
  token = res.body.token;
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('tutorial practice match', () => {
  it('is winnable by always tapping the highlighted card, in exactly two turns', async () => {
    const start = await request(ctx.app).post('/practice/start').set(auth(token)).send({ tutorial: true });
    expect(start.status).toBe(201);
    let highlight = start.body.highlightInstanceId;
    let matchId = start.body.matchId;
    expect(highlight).toBeTruthy();

    const turn1 = await request(ctx.app)
      .post(`/practice/${matchId}/play`)
      .set(auth(token))
      .send({ instanceId: highlight });
    expect(turn1.status).toBe(200);
    expect(turn1.body.turnResult.outcome).toBe('you');
    expect(turn1.body.view.status).toBe('in_progress');

    highlight = turn1.body.highlightInstanceId;
    const turn2 = await request(ctx.app)
      .post(`/practice/${matchId}/play`)
      .set(auth(token))
      .send({ instanceId: highlight });
    expect(turn2.status).toBe(200);
    expect(turn2.body.turnResult.outcome).toBe('you');
    expect(turn2.body.view.status).toBe('finished');
    expect(turn2.body.view.winner).toBe('you');
    expect(turn2.body.outcome.winner).toBe('you');
  });

  it('does NOT mark the tutorial completed just from winning the scripted battle', async () => {
    // Winning the practice battle is only the midpoint of onboarding -- the starter pack and
    // arena walkthrough steps still follow it, so the server must not flip this flag yet.
    const start = await request(ctx.app).post('/practice/start').set(auth(token)).send({ tutorial: true });
    let matchId = start.body.matchId;
    let highlight = start.body.highlightInstanceId;

    const turn1 = await request(ctx.app)
      .post(`/practice/${matchId}/play`)
      .set(auth(token))
      .send({ instanceId: highlight });
    highlight = turn1.body.highlightInstanceId;
    await request(ctx.app).post(`/practice/${matchId}/play`).set(auth(token)).send({ instanceId: highlight });

    const me = await request(ctx.app).get('/me').set(auth(token));
    expect(me.body.profile.tutorialCompleted).toBe(false);
  });

  it('only marks the tutorial completed when the client explicitly finishes onboarding', async () => {
    const done = await request(ctx.app).post('/me/tutorial-complete').set(auth(token));
    expect(done.status).toBe(200);
    expect(done.body.profile.tutorialCompleted).toBe(true);
  });
});

describe('regular practice match against the AI bot', () => {
  it('requires owning at least one card', async () => {
    const res = await request(ctx.app).post('/practice/start').set(auth(token)).send({});
    expect(res.status).toBe(400);
  });

  it('starts once the player has opened their starter pack, and can be played to completion', async () => {
    await request(ctx.app).post('/packs/starter/open').set(auth(token));
    const start = await request(ctx.app).post('/practice/start').set(auth(token)).send({});
    expect(start.status).toBe(201);
    const matchId = start.body.matchId;
    expect(start.body.view.you.hand.length).toBeGreaterThan(0);

    let view = start.body.view;
    let guard = 0;
    while (view.status !== 'finished' && guard < 100) {
      const cardId = view.you.hand[0].instanceId;
      const turn = await request(ctx.app)
        .post(`/practice/${matchId}/play`)
        .set(auth(token))
        .send({ instanceId: cardId });
      expect(turn.status).toBe(200);
      view = turn.body.view;
      guard++;
    }
    expect(view.status).toBe('finished');
    expect(['you', 'opponent', 'draw']).toContain(view.winner);
  });
});
