import type { Db } from '../db';

export interface DailyMissionRow {
  user_id: string;
  date_key: string;
  mission_id: string;
  progress: number;
  claimed: number;
}

export function getDailyMissionRows(db: Db, userId: string, dateKey: string): DailyMissionRow[] {
  return db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date_key = ?').all(userId, dateKey) as DailyMissionRow[];
}

/** No-op if today's rows already exist for this player (idempotent, safe to call on every request). */
export function ensureDailyMissions(db: Db, userId: string, dateKey: string, missionIds: string[]): DailyMissionRow[] {
  const existing = getDailyMissionRows(db, userId, dateKey);
  if (existing.length > 0) return existing;
  const insert = db.prepare('INSERT INTO daily_missions (user_id, date_key, mission_id, progress, claimed) VALUES (?, ?, ?, 0, 0)');
  const insertAll = db.transaction((ids: string[]) => {
    for (const id of ids) insert.run(userId, dateKey, id);
  });
  insertAll(missionIds);
  return getDailyMissionRows(db, userId, dateKey);
}

export function bumpMissionProgress(db: Db, userId: string, dateKey: string, missionIds: string[]): void {
  if (missionIds.length === 0) return;
  const placeholders = missionIds.map(() => '?').join(',');
  db.prepare(
    `UPDATE daily_missions SET progress = progress + 1
     WHERE user_id = ? AND date_key = ? AND mission_id IN (${placeholders}) AND claimed = 0`,
  ).run(userId, dateKey, ...missionIds);
}

export function claimDailyMission(db: Db, userId: string, dateKey: string, missionId: string): DailyMissionRow | undefined {
  const row = db
    .prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date_key = ? AND mission_id = ?')
    .get(userId, dateKey, missionId) as DailyMissionRow | undefined;
  if (!row) return undefined;
  db.prepare('UPDATE daily_missions SET claimed = 1 WHERE user_id = ? AND date_key = ? AND mission_id = ?').run(
    userId,
    dateKey,
    missionId,
  );
  return { ...row, claimed: 1 };
}
