/** Account level is separate from card level and belt/arena progress -- it's a simple XP grind. */
const BASE_XP_TO_NEXT = 100;
const XP_GROWTH_PER_LEVEL = 60;
export const MAX_PLAYER_LEVEL = 60;

export function xpToNextLevel(level: number): number {
  if (level >= MAX_PLAYER_LEVEL) return 0;
  return BASE_XP_TO_NEXT + (level - 1) * XP_GROWTH_PER_LEVEL;
}

export interface XpState {
  level: number;
  /** XP accumulated into the current level (0 once the level cap is reached). */
  xp: number;
}

export interface AddXpResult extends XpState {
  leveledUp: boolean;
  levelsGained: number;
}

/** Applies gained XP, rolling over into as many level-ups as the amount covers. */
export function addXp(current: XpState, gained: number): AddXpResult {
  let level = current.level;
  let xp = current.xp + Math.max(0, gained);
  let levelsGained = 0;

  while (level < MAX_PLAYER_LEVEL) {
    const needed = xpToNextLevel(level);
    if (xp < needed) break;
    xp -= needed;
    level += 1;
    levelsGained += 1;
  }

  if (level >= MAX_PLAYER_LEVEL) {
    level = MAX_PLAYER_LEVEL;
    xp = 0;
  }

  return { level, xp, leveledUp: levelsGained > 0, levelsGained };
}

export type MatchMode = 'practice' | 'casual' | 'ranked' | 'sensei';
export type MatchResult = 'win' | 'loss' | 'draw';

/** XP payout per match, mirroring the soft-currency reward shape/spirit. */
export const XP_REWARD: Record<MatchMode, Record<MatchResult, number>> = {
  practice: { win: 15, loss: 5, draw: 8 },
  casual: { win: 30, loss: 10, draw: 15 },
  ranked: { win: 45, loss: 15, draw: 20 },
  sensei: { win: 200, loss: 20, draw: 20 },
};

export function xpFor(mode: MatchMode, result: MatchResult): number {
  return XP_REWARD[mode][result];
}
