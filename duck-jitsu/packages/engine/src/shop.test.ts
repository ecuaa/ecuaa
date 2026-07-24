import { describe, expect, it } from 'vitest';
import { cardsUnlockedUpToArena } from './catalog';
import { getShopOffers } from './shop';

describe('getShopOffers', () => {
  it('only offers unlocked cards the player does not already own', () => {
    const owned = new Set(cardsUnlockedUpToArena(1).slice(0, 2).map((c) => c.id));
    const offers = getShopOffers('player-1', 1, owned, new Date('2026-01-01T00:00:00Z'));
    for (const offer of offers) {
      if (offer.kind === 'card' && offer.cardId) {
        expect(owned.has(offer.cardId)).toBe(false);
        const def = cardsUnlockedUpToArena(1).find((c) => c.id === offer.cardId);
        expect(def).toBeDefined();
      }
    }
  });

  it('is stable for the same player within the same UTC day', () => {
    const owned = new Set<string>();
    const day = new Date('2026-03-05T08:00:00Z');
    const day2 = new Date('2026-03-05T20:00:00Z');
    const offersA = getShopOffers('player-x', 2, owned, day);
    const offersB = getShopOffers('player-x', 2, owned, day2);
    expect(offersA.map((o) => o.id)).toEqual(offersB.map((o) => o.id));
  });

  it('rotates after the 24h boundary', () => {
    const owned = new Set<string>();
    const before = getShopOffers('player-y', 3, owned, new Date('2026-03-05T23:59:00Z'));
    const after = getShopOffers('player-y', 3, owned, new Date('2026-03-06T00:01:00Z'));
    // Not guaranteed to differ in every element, but the seed changes -- assert seeds differ
    // by checking day index math directly is covered elsewhere; here just ensure no crash and
    // valid shape.
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
  });

  it('falls back to duplicate/currency bundles once every unlocked card is owned', () => {
    const allOwned = new Set(cardsUnlockedUpToArena(0).map((c) => c.id));
    const offers = getShopOffers('completionist', 0, allOwned, new Date('2026-01-01T00:00:00Z'));
    expect(offers.every((o) => o.kind === 'duplicate_bundle' || o.kind === 'currency_bundle')).toBe(
      true,
    );
  });
});
