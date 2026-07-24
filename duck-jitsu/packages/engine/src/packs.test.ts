import { describe, expect, it } from 'vitest';
import { createRng } from './rng';
import { openPack, openStarterPack, PACKS, rarityBand } from './packs';
import { cardsUnlockedUpToArena } from './catalog';

describe('openStarterPack', () => {
  it('is deterministic and only contains arena-0 cards', () => {
    const a = openStarterPack();
    const b = openStarterPack();
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    for (const card of a) expect(card.unlockArena).toBe(0);
  });
});

describe('openPack', () => {
  it('never includes a card locked beyond the player arena tier', () => {
    const rng = createRng(42);
    for (let i = 0; i < 50; i++) {
      const results = openPack('basic', 1, rng);
      for (const card of results) {
        expect(card.unlockArena).toBeLessThanOrEqual(1);
      }
    }
  });

  it('respects the configured card count', () => {
    const rng = createRng(1);
    expect(openPack('basic', 3, rng)).toHaveLength(PACKS.basic.cardCount);
    expect(openPack('premium', 3, rng)).toHaveLength(PACKS.premium.cardCount);
  });

  it('falls back to a lower rarity band when a higher one has nothing eligible yet', () => {
    const rng = createRng(7);
    // At arena 0, nothing special/legendary is unlocked -- must never throw or hang.
    for (let i = 0; i < 20; i++) {
      const results = openPack('premium', 0, rng);
      expect(results.length).toBe(PACKS.premium.cardCount);
      for (const card of results) {
        expect(card.special).toBe(false);
        expect(cardsUnlockedUpToArena(0).map((c) => c.id)).toContain(card.id);
      }
    }
  });

  it('throws for an unknown pack id', () => {
    expect(() => openPack('does-not-exist', 5)).toThrow();
  });
});

describe('rarityBand', () => {
  it('classifies special cards as special regardless of numeric rarity', () => {
    expect(
      rarityBand({
        id: 'x',
        name: 'x',
        element: 'fire',
        rarity: 2,
        color: 'red',
        special: true,
        unlockArena: 0,
        maxLevel: 3,
      }),
    ).toBe('special');
  });
});
