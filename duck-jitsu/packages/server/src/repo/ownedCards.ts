import type { OwnedCard } from '@duck-jitsu/engine';
import type { Db } from '../db';

interface OwnedCardRow {
  user_id: string;
  card_id: string;
  level: number;
  duplicates: number;
}

export function getOwnedCards(db: Db, userId: string): OwnedCard[] {
  const rows = db
    .prepare('SELECT * FROM owned_cards WHERE user_id = ?')
    .all(userId) as OwnedCardRow[];
  return rows.map((r) => ({ cardId: r.card_id, level: r.level, duplicates: r.duplicates }));
}

export function getOwnedCard(db: Db, userId: string, cardId: string): OwnedCard | undefined {
  const row = db
    .prepare('SELECT * FROM owned_cards WHERE user_id = ? AND card_id = ?')
    .get(userId, cardId) as OwnedCardRow | undefined;
  if (!row) return undefined;
  return { cardId: row.card_id, level: row.level, duplicates: row.duplicates };
}

/** Grants one copy of a card: adds it at level 1 if new, otherwise adds a duplicate. */
export function grantCard(db: Db, userId: string, cardId: string): void {
  const existing = getOwnedCard(db, userId, cardId);
  if (!existing) {
    db.prepare(
      'INSERT INTO owned_cards (user_id, card_id, level, duplicates) VALUES (?, ?, 1, 0)',
    ).run(userId, cardId);
  } else {
    db.prepare(
      'UPDATE owned_cards SET duplicates = duplicates + 1 WHERE user_id = ? AND card_id = ?',
    ).run(userId, cardId);
  }
}

export function setCardProgress(
  db: Db,
  userId: string,
  cardId: string,
  level: number,
  duplicates: number,
): void {
  db.prepare(
    'UPDATE owned_cards SET level = ?, duplicates = ? WHERE user_id = ? AND card_id = ?',
  ).run(level, duplicates, userId, cardId);
}
