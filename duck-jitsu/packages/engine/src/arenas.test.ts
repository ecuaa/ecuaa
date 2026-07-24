import { describe, expect, it } from 'vitest';
import { arenaForTrophies, ARENAS, nextArena } from './arenas';
import { cardsUnlockedAtArena } from './catalog';

describe('ARENAS', () => {
  it('reports trophy requirements in non-decreasing order', () => {
    for (let i = 1; i < ARENAS.length; i++) {
      expect(ARENAS[i].trophyRequirement).toBeGreaterThan(ARENAS[i - 1].trophyRequirement);
    }
  });

  it('unlocksCardIds matches the catalog exactly for each tier', () => {
    for (const arena of ARENAS) {
      const expected = cardsUnlockedAtArena(arena.tier).map((c) => c.id).sort();
      expect([...arena.unlocksCardIds].sort()).toEqual(expected);
    }
  });
});

describe('arenaForTrophies', () => {
  it('returns the highest arena the trophy count qualifies for', () => {
    expect(arenaForTrophies(0).tier).toBe(0);
    expect(arenaForTrophies(199).tier).toBe(0);
    expect(arenaForTrophies(200).tier).toBe(1);
    expect(arenaForTrophies(999999).tier).toBe(ARENAS[ARENAS.length - 1].tier);
  });
});

describe('nextArena', () => {
  it('returns undefined past the final arena', () => {
    expect(nextArena(ARENAS[ARENAS.length - 1].tier)).toBeUndefined();
  });
});
