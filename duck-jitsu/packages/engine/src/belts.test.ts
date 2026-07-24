import { describe, expect, it } from 'vitest';
import { ARENAS } from './arenas';
import { ARENA_BELTS, beltForArenaTier, playerBelt } from './belts';

describe('ARENA_BELTS', () => {
  it('has exactly one belt per arena', () => {
    expect(ARENA_BELTS.length).toBe(ARENAS.length);
  });

  it('never includes black -- black is earned, not climbed to', () => {
    expect(ARENA_BELTS).not.toContain('black');
  });
});

describe('beltForArenaTier', () => {
  it('maps tier 0 to white and the final tier to red', () => {
    expect(beltForArenaTier(0)).toBe('white');
    expect(beltForArenaTier(ARENAS.length - 1)).toBe('red');
  });

  it('clamps out-of-range tiers instead of throwing', () => {
    expect(beltForArenaTier(-5)).toBe('white');
    expect(beltForArenaTier(999)).toBe('red');
  });
});

describe('playerBelt', () => {
  it('follows arena tier when the Sensei has not been defeated', () => {
    expect(playerBelt(3, false)).toBe(beltForArenaTier(3));
  });

  it('is always black once the Sensei has been defeated, regardless of arena tier', () => {
    expect(playerBelt(0, true)).toBe('black');
    expect(playerBelt(7, true)).toBe('black');
  });
});
