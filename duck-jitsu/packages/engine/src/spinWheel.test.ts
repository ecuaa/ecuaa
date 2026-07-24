import { describe, expect, it } from 'vitest';
import { createRng } from './rng';
import { SPIN_WHEEL_SEGMENTS, spinWheel, spinWheelStatus } from './spinWheel';

describe('spinWheel', () => {
  it('always returns one of the defined segments', () => {
    const rng = createRng(42);
    for (let i = 0; i < 50; i++) {
      const segment = spinWheel(rng);
      expect(SPIN_WHEEL_SEGMENTS.some((s) => s.id === segment.id)).toBe(true);
    }
  });

  it('produces a spread of outcomes over many spins, not always the same segment', () => {
    const rng = createRng(7);
    const seen = new Set(Array.from({ length: 100 }, () => spinWheel(rng).id));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('spinWheelStatus', () => {
  it('is claimable immediately for a player who has never spun', () => {
    expect(spinWheelStatus(null, new Date()).claimable).toBe(true);
  });

  it('is not claimable within 24 hours of the last spin', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-24T10:00:00Z');
    const status = spinWheelStatus(last, now);
    expect(status.claimable).toBe(false);
    expect(status.hoursUntilNextSpin).toBeGreaterThan(0);
  });

  it('is claimable again after 24 hours', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-25T01:00:00Z');
    expect(spinWheelStatus(last, now).claimable).toBe(true);
  });
});
