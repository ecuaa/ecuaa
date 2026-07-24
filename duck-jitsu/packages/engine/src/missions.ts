import { createRng, shuffle } from './rng';

export type MissionType = 'win_matches' | 'play_matches' | 'open_packs' | 'purchase_shop_offer';

export interface MissionReward {
  softCurrency?: number;
  premiumCurrency?: number;
  xp?: number;
}

export interface MissionDef {
  id: string;
  type: MissionType;
  target: number;
  description: string;
  reward: MissionReward;
}

/** Template pool daily missions are drawn from -- kept small and hand-tuned rather than generated. */
export const MISSION_CATALOG: MissionDef[] = [
  { id: 'win-1', type: 'win_matches', target: 1, description: 'Win 1 battle', reward: { softCurrency: 40, xp: 20 } },
  { id: 'win-3', type: 'win_matches', target: 3, description: 'Win 3 battles', reward: { softCurrency: 120, xp: 60 } },
  { id: 'play-5', type: 'play_matches', target: 5, description: 'Play 5 battles', reward: { softCurrency: 80, xp: 40 } },
  { id: 'open-1', type: 'open_packs', target: 1, description: 'Open 1 card pack', reward: { softCurrency: 60, xp: 30 } },
  { id: 'open-2', type: 'open_packs', target: 2, description: 'Open 2 card packs', reward: { premiumCurrency: 5, xp: 40 } },
  { id: 'shop-1', type: 'purchase_shop_offer', target: 1, description: 'Buy anything from the Shop', reward: { softCurrency: 50, xp: 25 } },
];

const DAILY_MISSION_COUNT = 3;

/** Hashes a YYYY-MM-DD date string into a seed so a given day always rolls the same set. */
function seedForDate(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Deterministically picks today's mission set from the catalog -- same date always yields the same picks. */
export function generateDailyMissions(dateKey: string): MissionDef[] {
  const rng = createRng(seedForDate(dateKey));
  return shuffle(MISSION_CATALOG, rng).slice(0, DAILY_MISSION_COUNT);
}

export function missionComplete(progress: number, mission: MissionDef): boolean {
  return progress >= mission.target;
}
