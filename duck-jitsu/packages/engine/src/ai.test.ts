import { describe, expect, it } from 'vitest';
import { AI_DIFFICULTIES, pickAiCard, pickScriptedCard } from './ai';
import { createRng } from './rng';
import type { PlayableCard } from './types';

function hand(): PlayableCard[] {
  return [
    { instanceId: 'f', cardId: 'f', element: 'fire', rarity: 5, color: 'red', level: 1, special: false },
    { instanceId: 'w', cardId: 'w', element: 'water', rarity: 5, color: 'blue', level: 1, special: false },
    { instanceId: 'i', cardId: 'i', element: 'ice', rarity: 5, color: 'green', level: 1, special: false },
  ];
}

describe('pickAiCard', () => {
  it('is heavily biased toward the counter element over many trials', () => {
    // Opponent last played fire -> counter is water.
    const rng = createRng(123);
    const counts = { fire: 0, water: 0, ice: 0 };
    for (let i = 0; i < 500; i++) {
      const choice = pickAiCard(hand(), 'fire', rng, AI_DIFFICULTIES.practice);
      counts[choice.element]++;
    }
    expect(counts.water).toBeGreaterThan(counts.fire);
    expect(counts.water).toBeGreaterThan(counts.ice);
    // But not deterministic -- some randomness should let other elements appear too.
    expect(counts.fire + counts.ice).toBeGreaterThan(0);
  });

  it('still picks a valid card with no prior opponent element', () => {
    const rng = createRng(1);
    const choice = pickAiCard(hand(), undefined, rng);
    expect(['fire', 'water', 'ice']).toContain(choice.element);
  });

  it('throws on an empty hand', () => {
    expect(() => pickAiCard([], undefined)).toThrow();
  });
});

describe('pickScriptedCard', () => {
  it('always plays the front of the hand', () => {
    const h = hand();
    expect(pickScriptedCard(h)).toBe(h[0]);
  });

  it('throws on an empty hand', () => {
    expect(() => pickScriptedCard([])).toThrow();
  });
});
