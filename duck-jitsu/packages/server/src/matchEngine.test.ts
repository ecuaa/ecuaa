import { createMatch, playTurn, type PlayableCard } from '@duck-jitsu/engine';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { finalizeMatch, personalizeOutcome } from './matchEngine';
import { createUser, getUserById } from './repo/users';

let db: Db;
let userA: ReturnType<typeof createUser>;
let userB: ReturnType<typeof createUser>;

function card(overrides: Partial<PlayableCard> = {}): PlayableCard {
  return {
    instanceId: randomUUID(),
    cardId: 'x',
    element: 'fire',
    rarity: 5,
    color: 'red',
    level: 1,
    special: false,
    ...overrides,
  };
}

beforeEach(() => {
  db = createDb(':memory:');
  userA = createUser(db, { id: randomUUID(), email: 'a@x.com', passwordHash: null, isGuest: false, displayName: 'A' });
  userB = createUser(db, { id: randomUUID(), email: 'b@x.com', passwordHash: null, isGuest: false, displayName: 'B' });
});

function playToWin(): ReturnType<typeof createMatch> {
  const winningCard = card({ element: 'fire', color: 'green' });
  const loserCard = card({ element: 'ice', color: 'purple' });
  let state = createMatch(userA.id, [winningCard], userB.id, [loserCard]);
  state.a.collected.push(card({ element: 'fire', color: 'red' }), card({ element: 'fire', color: 'blue' }));
  return playTurn(state, winningCard.instanceId, loserCard.instanceId).state;
}

describe('finalizeMatch soft currency payouts', () => {
  it('credits the winner more than a loser for a casual match against another player', () => {
    const finished = playToWin();
    const before = { a: getUserById(db, userA.id)!.soft_currency, b: getUserById(db, userB.id)!.soft_currency };

    const outcome = finalizeMatch(db, {
      mode: 'casual',
      matchState: finished,
      playerAId: userA.id,
      playerBId: userB.id,
      playerAName: 'A',
      playerBName: 'B',
      bIsBot: false,
    });

    expect(outcome.softCurrencyDeltaA).toBeGreaterThan(outcome.softCurrencyDeltaB);
    const afterA = getUserById(db, userA.id)!.soft_currency;
    const afterB = getUserById(db, userB.id)!.soft_currency;
    expect(afterA).toBe(before.a + outcome.softCurrencyDeltaA);
    expect(afterB).toBe(before.b + outcome.softCurrencyDeltaB);
  });

  it('never credits a bot opponent', () => {
    const finished = playToWin();
    const before = getUserById(db, userB.id)!.soft_currency;

    finalizeMatch(db, {
      mode: 'practice',
      matchState: finished,
      playerAId: userA.id,
      playerBId: userB.id,
      playerAName: 'A',
      playerBName: 'AI',
      bIsBot: true,
    });

    expect(getUserById(db, userB.id)!.soft_currency).toBe(before);
  });

  it('pays ranked matches more than casual ones for the same result', () => {
    const casual = finalizeMatch(db, {
      mode: 'casual',
      matchState: playToWin(),
      playerAId: userA.id,
      playerBId: userB.id,
      playerAName: 'A',
      playerBName: 'B',
      bIsBot: false,
    });
    const ranked = finalizeMatch(db, {
      mode: 'ranked',
      matchState: playToWin(),
      playerAId: userA.id,
      playerBId: userB.id,
      playerAName: 'A',
      playerBName: 'B',
      bIsBot: false,
    });
    expect(ranked.softCurrencyDeltaA).toBeGreaterThan(casual.softCurrencyDeltaA);
  });

  it('personalizeOutcome reports each side its own soft currency delta', () => {
    const outcome = finalizeMatch(db, {
      mode: 'casual',
      matchState: playToWin(),
      playerAId: userA.id,
      playerBId: userB.id,
      playerAName: 'A',
      playerBName: 'B',
      bIsBot: false,
    });
    const forA = personalizeOutcome(outcome, 'a');
    const forB = personalizeOutcome(outcome, 'b');
    expect(forA.softCurrencyDelta).toBe(outcome.softCurrencyDeltaA);
    expect(forB.softCurrencyDelta).toBe(outcome.softCurrencyDeltaB);
  });
});
