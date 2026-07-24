import { describe, expect, it } from 'vitest';
import { AI_DIFFICULTIES, pickAiCard } from './ai';
import { isSenseiUnlocked, maxArenaTier, ARENAS } from './arenas';
import { SENSEI_CARD_LEVEL, SENSEI_DECK_CARD_IDS } from './catalog';
import { buildSenseiDeck, MIN_DECK_SIZE } from './deck';
import { createRng } from './rng';

describe('Sensei deck', () => {
  it('is entirely Special Cards, all maxed to level 10', () => {
    const deck = buildSenseiDeck(createRng(1));
    expect(deck.length).toBeGreaterThanOrEqual(MIN_DECK_SIZE);
    for (const card of deck) {
      expect(card.special).toBe(true);
      expect(card.level).toBe(SENSEI_CARD_LEVEL);
    }
  });

  it('contains one copy of every special card the catalog defines', () => {
    const deck = buildSenseiDeck(createRng(2));
    const uniqueIds = new Set(deck.map((c) => c.cardId));
    const expectedUniqueIds = new Set(SENSEI_DECK_CARD_IDS);
    expect(uniqueIds).toEqual(expectedUniqueIds);
  });
});

describe('Sensei unlock gating', () => {
  it('is locked below the final arena and unlocked at or above it', () => {
    const finalArena = ARENAS[ARENAS.length - 1];
    expect(isSenseiUnlocked(finalArena.trophyRequirement - 1)).toBe(false);
    expect(isSenseiUnlocked(finalArena.trophyRequirement)).toBe(true);
    expect(isSenseiUnlocked(finalArena.trophyRequirement + 10_000)).toBe(true);
  });

  it('maxArenaTier matches the last defined arena', () => {
    expect(maxArenaTier()).toBe(ARENAS[ARENAS.length - 1].tier);
  });
});

describe('Sensei AI difficulty', () => {
  it('is far more counter-biased than any other difficulty tier', () => {
    expect(AI_DIFFICULTIES.sensei.counterBias).toBeGreaterThan(AI_DIFFICULTIES.ranked_bot.counterBias * 2);
  });

  it('overwhelmingly favors the counter element over many trials', () => {
    const hand = [
      { instanceId: 'f', cardId: 'f', element: 'fire' as const, rarity: 10, color: 'red' as const, level: 10, special: true },
      { instanceId: 'w', cardId: 'w', element: 'water' as const, rarity: 10, color: 'blue' as const, level: 10, special: true },
      { instanceId: 'i', cardId: 'i', element: 'ice' as const, rarity: 10, color: 'green' as const, level: 10, special: true },
    ];
    const rng = createRng(42);
    let waterCount = 0;
    for (let i = 0; i < 200; i++) {
      // Opponent last played fire -> water counters it.
      if (pickAiCard(hand, 'fire', rng, AI_DIFFICULTIES.sensei).element === 'water') waterCount++;
    }
    expect(waterCount).toBeGreaterThan(180);
  });
});
