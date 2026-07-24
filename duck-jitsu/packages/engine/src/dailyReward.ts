export interface DailyRewardEntry {
  softCurrency: number;
  premiumCurrency: number;
}

/** 7-day escalating cycle; day 7 is the big payout, then it loops back to day 1. */
export const DAILY_REWARD_TABLE: DailyRewardEntry[] = [
  { softCurrency: 50, premiumCurrency: 0 },
  { softCurrency: 75, premiumCurrency: 0 },
  { softCurrency: 100, premiumCurrency: 5 },
  { softCurrency: 125, premiumCurrency: 5 },
  { softCurrency: 150, premiumCurrency: 10 },
  { softCurrency: 200, premiumCurrency: 10 },
  { softCurrency: 300, premiumCurrency: 25 },
];

const CLAIM_COOLDOWN_HOURS = 24;
/** Missing more than this many hours resets the streak back to day 1 instead of continuing it. */
const STREAK_BREAK_HOURS = 48;

export interface DailyRewardStatus {
  claimable: boolean;
  hoursUntilNextClaim: number;
  /** The streak day (1-7) that would be granted if claimed right now. */
  nextStreakDay: number;
}

export function dailyRewardStatus(streak: number, lastClaimedAt: Date | null, now: Date): DailyRewardStatus {
  if (!lastClaimedAt) {
    return { claimable: true, hoursUntilNextClaim: 0, nextStreakDay: 1 };
  }
  const hoursSince = (now.getTime() - lastClaimedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince < CLAIM_COOLDOWN_HOURS) {
    return { claimable: false, hoursUntilNextClaim: CLAIM_COOLDOWN_HOURS - hoursSince, nextStreakDay: (streak % 7) + 1 };
  }
  const streakBroken = hoursSince > STREAK_BREAK_HOURS;
  const nextStreakDay = streakBroken ? 1 : (streak % 7) + 1;
  return { claimable: true, hoursUntilNextClaim: 0, nextStreakDay };
}

export interface ClaimDailyRewardResult {
  streakDay: number;
  reward: DailyRewardEntry;
}

/** Throws if not currently claimable -- callers should check dailyRewardStatus().claimable first. */
export function claimDailyReward(streak: number, lastClaimedAt: Date | null, now: Date): ClaimDailyRewardResult {
  const status = dailyRewardStatus(streak, lastClaimedAt, now);
  if (!status.claimable) {
    throw new Error('Daily reward is not claimable yet');
  }
  return { streakDay: status.nextStreakDay, reward: DAILY_REWARD_TABLE[status.nextStreakDay - 1] };
}
