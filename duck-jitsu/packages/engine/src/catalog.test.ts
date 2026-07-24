import { describe, expect, it } from 'vitest';
import {
  CARD_CATALOG,
  cardsUnlockedAtArena,
  cardsUnlockedUpToArena,
  getCardDef,
  STARTER_PACK_CARD_IDS,
} from './catalog';
import { ARENAS } from './arenas';

describe('CARD_CATALOG', () => {
  it('has unique ids', () => {
    const ids = new Set(CARD_CATALOG.map((c) => c.id));
    expect(ids.size).toBe(CARD_CATALOG.length);
  });

  it('never unlocks a card at an arena tier beyond the defined arenas', () => {
    const maxTier = Math.max(...ARENAS.map((a) => a.tier));
    for (const card of CARD_CATALOG) {
      expect(card.unlockArena).toBeLessThanOrEqual(maxTier);
      expect(card.unlockArena).toBeGreaterThanOrEqual(0);
    }
  });

  it('offers at least 3 distinct colors per element by the final arena (win condition is reachable)', () => {
    for (const element of ['fire', 'water', 'ice'] as const) {
      const colors = new Set(
        cardsUnlockedUpToArena(7)
          .filter((c) => c.element === element)
          .map((c) => c.color),
      );
      expect(colors.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('gates special cards behind higher arena tiers', () => {
    const specials = CARD_CATALOG.filter((c) => c.special);
    expect(specials.length).toBeGreaterThan(0);
    for (const special of specials) {
      expect(special.unlockArena).toBeGreaterThanOrEqual(2);
    }
  });

  it('getCardDef throws for unknown ids', () => {
    expect(() => getCardDef('does-not-exist')).toThrow();
  });
});

describe('starter pack', () => {
  it('is a small, fixed, low-rarity set all unlocked at arena 0', () => {
    expect(STARTER_PACK_CARD_IDS.length).toBeGreaterThan(0);
    expect(STARTER_PACK_CARD_IDS.length).toBeLessThanOrEqual(8);
    for (const id of STARTER_PACK_CARD_IDS) {
      const def = getCardDef(id);
      expect(def.unlockArena).toBe(0);
      expect(def.rarity).toBeLessThanOrEqual(3);
      expect(def.special).toBe(false);
    }
  });
});

describe('cardsUnlockedAtArena', () => {
  it('only returns cards whose unlockArena matches exactly', () => {
    const tier2 = cardsUnlockedAtArena(2);
    for (const card of tier2) {
      expect(card.unlockArena).toBe(2);
    }
  });
});
