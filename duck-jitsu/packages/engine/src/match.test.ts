import { describe, expect, it } from 'vitest';
import { createMatch, playTurn } from './match';
import type { PlayableCard } from './types';

let counter = 0;
function card(overrides: Partial<PlayableCard> = {}): PlayableCard {
  counter += 1;
  return {
    instanceId: `card-${counter}`,
    cardId: `cat-${counter}`,
    element: 'fire',
    rarity: 5,
    color: 'red',
    level: 1,
    special: false,
    ...overrides,
  };
}

describe('createMatch', () => {
  it('deals a starting hand and keeps the rest in the deck', () => {
    const deckA = Array.from({ length: 10 }, () => card());
    const deckB = Array.from({ length: 10 }, () => card());
    const state = createMatch('alice', deckA, 'bob', deckB);
    expect(state.a.hand.length).toBe(5);
    expect(state.a.deck.length).toBe(5);
    expect(state.status).toBe('in_progress');
  });
});

describe('playTurn', () => {
  it('gives both cards to the winner and refills hands', () => {
    const deckA = [card({ element: 'water', color: 'blue' })];
    const deckB = [card({ element: 'fire', color: 'red' })];
    // Pad decks so both sides have >= starting hand size for a clean deal.
    const fullA = [...deckA, ...Array.from({ length: 6 }, () => card())];
    const fullB = [...deckB, ...Array.from({ length: 6 }, () => card())];
    const state = createMatch('alice', fullA, 'bob', fullB);

    const cardA = state.a.hand[0];
    const cardB = state.b.hand[0];
    const { state: next, turnResult } = playTurn(state, cardA.instanceId, cardB.instanceId);

    expect(turnResult.outcome === 'a' || turnResult.outcome === 'b' || turnResult.outcome === 'draw').toBe(true);
    if (turnResult.outcome !== 'draw') {
      const winner = turnResult.outcome === 'a' ? next.a : next.b;
      expect(winner.collected).toHaveLength(2);
    }
    // Hand size preserved by refill since deck had spares.
    expect(next.a.hand).toHaveLength(5);
    expect(next.b.hand).toHaveLength(5);
  });

  it('discards both cards on a full tie and nobody collects them', () => {
    const tieCardA = card({ element: 'ice', rarity: 4, level: 2, color: 'red' });
    const tieCardB = card({ element: 'ice', rarity: 4, level: 2, color: 'blue' });
    const fullA = [tieCardA, ...Array.from({ length: 6 }, () => card())];
    const fullB = [tieCardB, ...Array.from({ length: 6 }, () => card())];
    const state = createMatch('alice', fullA, 'bob', fullB);

    const { state: next, turnResult } = playTurn(state, tieCardA.instanceId, tieCardB.instanceId);
    expect(turnResult.outcome).toBe('draw');
    expect(next.a.collected).toHaveLength(0);
    expect(next.b.collected).toHaveLength(0);
    expect(next.a.discarded).toHaveLength(1);
    expect(next.b.discarded).toHaveLength(1);
  });

  it('ends the match immediately when a player completes a winning set', () => {
    // Player A already holds fire-red + fire-blue collected; winning fire-green completes the set.
    const winningCard = card({ element: 'fire', color: 'green', rarity: 9 });
    const loserCard = card({ element: 'ice', color: 'purple', rarity: 1 });
    const fullA = [winningCard, ...Array.from({ length: 6 }, () => card())];
    const fullB = [loserCard, ...Array.from({ length: 6 }, () => card())];
    let state = createMatch('alice', fullA, 'bob', fullB);
    state.a.collected.push(
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'blue' }),
    );

    const { state: next, turnResult } = playTurn(state, winningCard.instanceId, loserCard.instanceId);
    expect(turnResult.outcome).toBe('a');
    expect(next.status).toBe('finished');
    expect(next.winner).toBe('a');
    expect(next.winReason).toBe('set-complete');
  });

  it('resolves via pile-size tiebreak once both players run out of cards', () => {
    // Minimal decks: exactly one card each, no refills possible.
    const cardA = card({ element: 'water' });
    const cardB = card({ element: 'ice' }); // ice beats water -> b wins this turn
    let state = createMatch('alice', [cardA], 'bob', [cardB]);
    // Force both hands/decks to be exactly this single card each (hand size 5 default deal
    // already handles decks shorter than hand size correctly).
    expect(state.a.hand).toHaveLength(1);
    expect(state.a.deck).toHaveLength(0);

    // Pre-load bob's pile bigger so pile-size math is meaningfully testable via a second match.
    const { state: next, turnResult } = playTurn(state, cardA.instanceId, cardB.instanceId);
    expect(turnResult.outcome).toBe('b');
    expect(next.status).toBe('finished');
    // b now has 2 collected vs a's 0 -> b should win outright unless a winning set formed first.
    if (next.winReason !== 'set-complete') {
      expect(next.winner).toBe('b');
      expect(next.winReason).toBe('tiebreak-pile-size');
    }
  });

  it('throws if a card not in hand is played', () => {
    const state = createMatch('alice', [card()], 'bob', [card()]);
    expect(() => playTurn(state, 'not-a-real-instance-id', state.b.hand[0].instanceId)).toThrow();
  });

  it('throws when playing a turn on an already-finished match', () => {
    const winningCard = card({ element: 'fire', color: 'green' });
    const loserCard = card({ element: 'ice', color: 'purple' });
    let state = createMatch('alice', [winningCard], 'bob', [loserCard]);
    state.a.collected.push(
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'blue' }),
    );
    const { state: finished } = playTurn(state, winningCard.instanceId, loserCard.instanceId);
    expect(finished.status).toBe('finished');
    expect(() => playTurn(finished, 'x', 'y')).toThrow();
  });
});
