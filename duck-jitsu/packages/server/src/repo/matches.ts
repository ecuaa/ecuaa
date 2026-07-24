import type { Db } from '../db';

export interface MatchRecord {
  id: string;
  mode: 'casual' | 'ranked' | 'practice' | 'sensei';
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  winner: 'a' | 'b' | 'draw';
  winReason: string;
  trophyDeltaA: number;
  trophyDeltaB: number;
}

interface MatchRow {
  id: string;
  mode: string;
  player_a_id: string;
  player_b_id: string;
  player_a_name: string;
  player_b_name: string;
  winner: string;
  win_reason: string;
  trophy_delta_a: number;
  trophy_delta_b: number;
  created_at: string;
}

export function recordMatch(db: Db, m: MatchRecord): void {
  db.prepare(
    `INSERT INTO matches
      (id, mode, player_a_id, player_b_id, player_a_name, player_b_name, winner, win_reason, trophy_delta_a, trophy_delta_b, created_at)
     VALUES (@id, @mode, @playerAId, @playerBId, @playerAName, @playerBName, @winner, @winReason, @trophyDeltaA, @trophyDeltaB, @createdAt)`,
  ).run({ ...m, createdAt: new Date().toISOString() });
}

export interface MatchHistoryEntry {
  id: string;
  mode: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  trophyDelta: number;
  winReason: string;
  createdAt: string;
}

export function getMatchHistory(db: Db, userId: string, limit = 20): MatchHistoryEntry[] {
  const rows = db
    .prepare(
      `SELECT * FROM matches WHERE player_a_id = ? OR player_b_id = ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, userId, limit) as MatchRow[];

  return rows.map((row) => {
    const isA = row.player_a_id === userId;
    const opponentName = isA ? row.player_b_name : row.player_a_name;
    const trophyDelta = isA ? row.trophy_delta_a : row.trophy_delta_b;
    let result: 'win' | 'loss' | 'draw';
    if (row.winner === 'draw') result = 'draw';
    else result = (row.winner === 'a') === isA ? 'win' : 'loss';
    return {
      id: row.id,
      mode: row.mode,
      opponentName,
      result,
      trophyDelta,
      winReason: row.win_reason,
      createdAt: row.created_at,
    };
  });
}
