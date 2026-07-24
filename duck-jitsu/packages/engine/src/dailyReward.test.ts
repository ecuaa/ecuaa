import { describe, expect, it } from 'vitest';
import { claimDailyReward, DAILY_REWARD_TABLE, dailyRewardStatus } from './dailyReward';

describe('dailyRewardStatus', () => {
  it('is immediately claimable for a brand-new player', () => {
    const status = dailyRewardStatus(0, null, new Date('2026-07-24T12:00:00Z'));
    expect(status.claimable).toBe(true);
    expect(status.nextStreakDay).toBe(1);
  });

  it('is not claimable within 24 hours of the last claim', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-24T10:00:00Z');
    const status = dailyRewardStatus(1, last, now);
    expect(status.claimable).toBe(false);
    expect(status.hoursUntilNextClaim).toBeGreaterThan(0);
  });

  it('continues the streak after 24-48 hours', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-25T01:00:00Z');
    const status = dailyRewardStatus(2, last, now);
    expect(status.claimable).toBe(true);
    expect(status.nextStreakDay).toBe(3);
  });

  it('resets the streak after missing more than 48 hours', () => {
    const last = new Date('2026-07-20T00:00:00Z');
    const now = new Date('2026-07-24T00:00:00Z');
    const status = dailyRewardStatus(5, last, now);
    expect(status.claimable).toBe(true);
    expect(status.nextStreakDay).toBe(1);
  });

  it('wraps the streak from day 7 back to day 1', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-25T01:00:00Z');
    const status = dailyRewardStatus(7, last, now);
    expect(status.nextStreakDay).toBe(1);
  });
});

describe('claimDailyReward', () => {
  it('returns the matching reward table entry for the streak day', () => {
    const result = claimDailyReward(0, null, new Date('2026-07-24T12:00:00Z'));
    expect(result.streakDay).toBe(1);
    expect(result.reward).toEqual(DAILY_REWARD_TABLE[0]);
  });

  it('throws when not yet claimable', () => {
    const last = new Date('2026-07-24T00:00:00Z');
    const now = new Date('2026-07-24T05:00:00Z');
    expect(() => claimDailyReward(1, last, now)).toThrow();
  });
});
