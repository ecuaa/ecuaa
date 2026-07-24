import { describe, expect, it } from 'vitest';
import { checkWinCondition, resolveOutOfCardsTiebreak, resolveTurn } from './resolve';
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

describe('resolveTurn: elemental cycle', () => {
  it('water beats fire', () => {
    const a = card({ element: 'water' });
    const b = card({ element: 'fire' });
    const result = resolveTurn(a, b);
    expect(result.outcome).toBe('a');
    expect(result.reason).toBe('element-advantage');
  });

  it('fire beats ice', () => {
    const a = card({ element: 'fire' });
    const b = card({ element: 'ice' });
    expect(resolveTurn(a, b).outcome).toBe('a');
  });

  it('ice beats water', () => {
    const a = card({ element: 'ice' });
    const b = card({ element: 'water' });
    expect(resolveTurn(a, b).outcome).toBe('a');
  });

  it('is symmetric: fire loses to water regardless of slot', () => {
    const a = card({ element: 'fire' });
    const b = card({ element: 'water' });
    const result = resolveTurn(a, b);
    expect(result.outcome).toBe('b');
  });
});

describe('resolveTurn: same element', () => {
  it('higher rarity wins on a tie in element', () => {
    const a = card({ element: 'fire', rarity: 7, level: 1 });
    const b = card({ element: 'fire', rarity: 3, level: 1 });
    const result = resolveTurn(a, b);
    expect(result.outcome).toBe('a');
    expect(result.reason).toBe('higher-rarity');
  });

  it('level breaks a rarity tie', () => {
    const a = card({ element: 'water', rarity: 5, level: 3 });
    const b = card({ element: 'water', rarity: 5, level: 1 });
    const result = resolveTurn(a, b);
    expect(result.outcome).toBe('a');
    expect(result.reason).toBe('higher-level');
  });

  it('is a full draw when element, rarity, and level all match', () => {
    const a = card({ element: 'ice', rarity: 5, level: 2 });
    const b = card({ element: 'ice', rarity: 5, level: 2 });
    const result = resolveTurn(a, b);
    expect(result.outcome).toBe('draw');
    expect(result.reason).toBe('full-tie-draw');
  });
});

describe('checkWinCondition', () => {
  it('is false for an empty pile', () => {
    expect(checkWinCondition([]).won).toBe(false);
  });

  it('wins on three of the same element in different colors', () => {
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'blue' }),
      card({ element: 'fire', color: 'green' }),
    ];
    const result = checkWinCondition(pile);
    expect(result.won).toBe(true);
    expect(result.reason).toBe('three-of-element');
    expect(result.element).toBe('fire');
  });

  it('does NOT win on three of the same element if two share a color', () => {
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'green' }),
    ];
    expect(checkWinCondition(pile).won).toBe(false);
  });

  it('wins on one of each element in different colors', () => {
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'water', color: 'blue' }),
      card({ element: 'ice', color: 'green' }),
    ];
    const result = checkWinCondition(pile);
    expect(result.won).toBe(true);
    expect(result.reason).toBe('one-of-each-element');
  });

  it('does NOT win one-of-each if two of the three share a color', () => {
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'water', color: 'red' }),
      card({ element: 'ice', color: 'green' }),
    ];
    expect(checkWinCondition(pile).won).toBe(false);
  });

  it('finds a valid one-of-each combo even with extra same-color duplicates', () => {
    // Fire has two copies of 'red', but also one 'blue'; must pick the blue one to succeed.
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'fire', color: 'blue' }),
      card({ element: 'water', color: 'red' }),
      card({ element: 'ice', color: 'green' }),
    ];
    const result = checkWinCondition(pile);
    expect(result.won).toBe(true);
    expect(result.reason).toBe('one-of-each-element');
  });

  it('does not falsely win when only two elements are present', () => {
    const pile = [
      card({ element: 'fire', color: 'red' }),
      card({ element: 'water', color: 'blue' }),
      card({ element: 'fire', color: 'green' }),
    ];
    expect(checkWinCondition(pile).won).toBe(false);
  });
});

describe('resolveOutOfCardsTiebreak', () => {
  it('awards the larger pile', () => {
    expect(resolveOutOfCardsTiebreak([card(), card()], [card()])).toBe('a');
    expect(resolveOutOfCardsTiebreak([card()], [card(), card()])).toBe('b');
  });

  it('is a draw when piles are equal', () => {
    expect(resolveOutOfCardsTiebreak([card()], [card()])).toBe('draw');
  });
});
