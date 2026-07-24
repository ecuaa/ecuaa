import { describe, expect, it } from 'vitest';
import { addXp, MAX_PLAYER_LEVEL, xpFor, xpToNextLevel } from './playerLevel';

describe('xpToNextLevel', () => {
  it('grows with level', () => {
    expect(xpToNextLevel(2)).toBeGreaterThan(xpToNextLevel(1));
  });

  it('is zero at the level cap -- there is nowhere further to go', () => {
    expect(xpToNextLevel(MAX_PLAYER_LEVEL)).toBe(0);
  });
});

describe('addXp', () => {
  it('accumulates xp without leveling up when under the threshold', () => {
    const result = addXp({ level: 1, xp: 0 }, 10);
    expect(result.level).toBe(1);
    expect(result.xp).toBe(10);
    expect(result.leveledUp).toBe(false);
  });

  it('levels up and carries over remaining xp', () => {
    const needed = xpToNextLevel(1);
    const result = addXp({ level: 1, xp: 0 }, needed + 15);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(15);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
  });

  it('rolls through multiple level-ups from one large gain', () => {
    const result = addXp({ level: 1, xp: 0 }, 100000);
    expect(result.levelsGained).toBeGreaterThan(1);
  });

  it('clamps at the max level and stops accumulating xp', () => {
    const result = addXp({ level: MAX_PLAYER_LEVEL, xp: 0 }, 99999);
    expect(result.level).toBe(MAX_PLAYER_LEVEL);
    expect(result.xp).toBe(0);
    expect(result.leveledUp).toBe(false);
  });
});

describe('xpFor', () => {
  it('always pays more for a win than a loss', () => {
    for (const mode of ['practice', 'casual', 'ranked', 'sensei'] as const) {
      expect(xpFor(mode, 'win')).toBeGreaterThan(xpFor(mode, 'loss'));
    }
  });
});
