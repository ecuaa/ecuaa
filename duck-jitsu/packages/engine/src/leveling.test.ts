import { describe, expect, it } from 'vitest';
import { applyLevelUp, duplicatesRequiredForLevel, effectiveLevelCap, tryLevelUp } from './leveling';
import type { CardDef, OwnedCard } from './types';

const baseCard: CardDef = {
  id: 'fire-red-t0-0',
  name: 'Ember Duckling (Red)',
  element: 'fire',
  rarity: 1,
  color: 'red',
  special: false,
  unlockArena: 0,
  maxLevel: 5,
};

describe('effectiveLevelCap', () => {
  it('starts at the base cap when the player is exactly at the unlock arena', () => {
    expect(effectiveLevelCap(baseCard, 0)).toBe(3);
  });

  it('grows as the player advances arenas, capped at maxLevel', () => {
    expect(effectiveLevelCap(baseCard, 1)).toBe(4);
    expect(effectiveLevelCap(baseCard, 2)).toBe(5);
    expect(effectiveLevelCap(baseCard, 10)).toBe(5); // clamped to maxLevel
  });
});

describe('tryLevelUp / applyLevelUp', () => {
  it('refuses to level up without enough duplicates', () => {
    const owned: OwnedCard = { cardId: baseCard.id, level: 1, duplicates: 1 };
    const result = tryLevelUp(owned, baseCard, 0);
    expect(result.canLevelUp).toBe(false);
    expect(result.reason).toBe('not-enough-duplicates');
    expect(result.duplicatesNeeded).toBe(duplicatesRequiredForLevel(1));
  });

  it('levels up and consumes duplicates when enough are available', () => {
    const owned: OwnedCard = { cardId: baseCard.id, level: 1, duplicates: 5 };
    const result = tryLevelUp(owned, baseCard, 0);
    expect(result.canLevelUp).toBe(true);
    const updated = applyLevelUp(owned, result);
    expect(updated.level).toBe(2);
    expect(updated.duplicates).toBe(5 - duplicatesRequiredForLevel(1));
  });

  it('refuses to level up past the effective cap even with unlimited duplicates', () => {
    const owned: OwnedCard = { cardId: baseCard.id, level: 3, duplicates: 999 };
    const result = tryLevelUp(owned, baseCard, 0); // cap is 3 at arena 0
    expect(result.canLevelUp).toBe(false);
    expect(result.reason).toBe('at-cap');
  });

  it('applyLevelUp throws on an invalid result', () => {
    expect(() => applyLevelUp({ cardId: 'x', level: 1, duplicates: 0 }, { canLevelUp: false })).toThrow();
  });
});
