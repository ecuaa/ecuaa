import { describe, expect, it } from 'vitest';
import { applyRankedResult, findRankedMatch, trophyRangeForWait } from './matchmaking';

describe('trophyRangeForWait', () => {
  it('widens over time and is clamped', () => {
    expect(trophyRangeForWait(0)).toBe(50);
    expect(trophyRangeForWait(3000)).toBeGreaterThan(50);
    expect(trophyRangeForWait(1_000_000)).toBeLessThanOrEqual(2000);
  });
});

describe('findRankedMatch', () => {
  it('picks the closest trophy count within range', () => {
    const entry = { playerId: 'a', trophies: 1000, queuedAtMs: 0 };
    const candidates = [
      { playerId: 'b', trophies: 1040, queuedAtMs: 0 },
      { playerId: 'c', trophies: 1010, queuedAtMs: 0 },
      { playerId: 'd', trophies: 3000, queuedAtMs: 0 },
    ];
    const match = findRankedMatch(entry, candidates, 0);
    expect(match?.playerId).toBe('c');
  });

  it('returns undefined when nobody is within range yet', () => {
    const entry = { playerId: 'a', trophies: 1000, queuedAtMs: 0 };
    const candidates = [{ playerId: 'b', trophies: 3000, queuedAtMs: 0 }];
    expect(findRankedMatch(entry, candidates, 0)).toBeUndefined();
  });

  it('finds a distant opponent once the range has widened enough', () => {
    const entry = { playerId: 'a', trophies: 1000, queuedAtMs: 0 };
    const candidates = [{ playerId: 'b', trophies: 1500, queuedAtMs: 0 }];
    expect(findRankedMatch(entry, candidates, 0)).toBeUndefined();
    expect(findRankedMatch(entry, candidates, 3_000_000)).toEqual(candidates[0]);
  });
});

describe('applyRankedResult', () => {
  it('increases trophies on a win and decreases on a loss', () => {
    expect(applyRankedResult(1000, true)).toBeGreaterThan(1000);
    expect(applyRankedResult(1000, false)).toBeLessThan(1000);
  });

  it('never drops trophies below zero', () => {
    expect(applyRankedResult(5, false)).toBe(0);
  });
});
