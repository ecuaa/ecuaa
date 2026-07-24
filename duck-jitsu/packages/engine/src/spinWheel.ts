import type { Rng } from './rng';
import { weightedPick } from './rng';

export interface SpinWheelReward {
  softCurrency?: number;
  premiumCurrency?: number;
}

export interface SpinWheelSegment {
  id: string;
  label: string;
  weight: number;
  reward: SpinWheelReward;
}

export const SPIN_WHEEL_SEGMENTS: SpinWheelSegment[] = [
  { id: 'soft-small', label: '50 Gold', weight: 30, reward: { softCurrency: 50 } },
  { id: 'soft-medium', label: '150 Gold', weight: 25, reward: { softCurrency: 150 } },
  { id: 'soft-large', label: '400 Gold', weight: 12, reward: { softCurrency: 400 } },
  { id: 'gem-small', label: '10 Gems', weight: 18, reward: { premiumCurrency: 10 } },
  { id: 'gem-medium', label: '25 Gems', weight: 9, reward: { premiumCurrency: 25 } },
  { id: 'jackpot', label: '1000 Gold + 100 Gems', weight: 6, reward: { softCurrency: 1000, premiumCurrency: 100 } },
];

const SPIN_COOLDOWN_HOURS = 24;

export function spinWheel(rng: Rng): SpinWheelSegment {
  return weightedPick(
    SPIN_WHEEL_SEGMENTS.map((item) => ({ item, weight: item.weight })),
    rng,
  );
}

export interface SpinWheelStatus {
  claimable: boolean;
  hoursUntilNextSpin: number;
}

export function spinWheelStatus(lastSpunAt: Date | null, now: Date): SpinWheelStatus {
  if (!lastSpunAt) return { claimable: true, hoursUntilNextSpin: 0 };
  const hoursSince = (now.getTime() - lastSpunAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince >= SPIN_COOLDOWN_HOURS) return { claimable: true, hoursUntilNextSpin: 0 };
  return { claimable: false, hoursUntilNextSpin: SPIN_COOLDOWN_HOURS - hoursSince };
}
