import { generateDailyMissions, type MissionType } from '@duck-jitsu/engine';
import type { Db } from './db';
import { bumpMissionProgress, ensureDailyMissions } from './repo/dailyMissions';

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Bumps progress by 1 on every one of today's missions matching `type`, creating today's rows first if needed. */
export function bumpMissionsOfType(db: Db, userId: string, type: MissionType): void {
  const dateKey = todayKey();
  const missionDefs = generateDailyMissions(dateKey);
  ensureDailyMissions(db, userId, dateKey, missionDefs.map((m) => m.id));
  const idsOfType = missionDefs.filter((m) => m.type === type).map((m) => m.id);
  bumpMissionProgress(db, userId, dateKey, idsOfType);
}
