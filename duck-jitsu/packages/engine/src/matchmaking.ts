export interface QueueEntry {
  playerId: string;
  trophies: number;
  queuedAtMs: number;
}

/** Trophy range widens the longer a player waits so ranked queues don't stall. */
export function trophyRangeForWait(waitMs: number): number {
  const steps = Math.floor(waitMs / 3000); // widen every 3 seconds
  return Math.min(2000, 50 + steps * 50);
}

/**
 * Finds the best ranked opponent for `entry` among `candidates` (candidates should exclude the
 * entry itself). Prefers the closest trophy count within the current allowed range; returns
 * undefined if nobody currently qualifies.
 */
export function findRankedMatch(
  entry: QueueEntry,
  candidates: QueueEntry[],
  nowMs: number,
): QueueEntry | undefined {
  const range = trophyRangeForWait(nowMs - entry.queuedAtMs);
  let best: QueueEntry | undefined;
  let bestDiff = Infinity;
  for (const candidate of candidates) {
    const diff = Math.abs(candidate.trophies - entry.trophies);
    if (diff <= range && diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best;
}

const TROPHY_WIN_GAIN = 30;
const TROPHY_LOSS = 25;

export function applyRankedResult(trophies: number, won: boolean): number {
  if (won) return trophies + TROPHY_WIN_GAIN;
  return Math.max(0, trophies - TROPHY_LOSS);
}
