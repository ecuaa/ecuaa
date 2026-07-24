import {
  applyRankedResult,
  arenaForTrophies,
  buildDeck,
  cardsUnlockedUpToArena,
  createRng,
  shuffle,
  type MatchState,
  type OwnedCard,
  type PlayableCard,
} from '@duck-jitsu/engine';
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { recordMatch } from './repo/matches';
import { getOwnedCards } from './repo/ownedCards';
import { getUserById, setTrophies } from './repo/users';

export function buildPlayerDeck(db: Db, userId: string): PlayableCard[] {
  const owned = getOwnedCards(db, userId);
  if (owned.length === 0) {
    throw new Error('Player has no cards to build a deck from');
  }
  return shuffle(buildDeck(owned));
}

/** Builds a reasonable AI deck: a random spread of cards the player's arena tier has unlocked. */
export function buildAiDeck(arenaTier: number, seed: number, size = 12): PlayableCard[] {
  const rng = createRng(seed);
  const pool = cardsUnlockedUpToArena(arenaTier);
  const owned: OwnedCard[] = Array.from({ length: size }, () => {
    const card = pool[Math.floor(rng() * pool.length)];
    return { cardId: card.id, level: 1, duplicates: 0 };
  });
  return shuffle(buildDeck(owned), rng);
}

export interface MatchOutcomeInput {
  mode: 'casual' | 'ranked' | 'practice';
  matchState: MatchState;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  /** True if side B is an AI bot (never gains/loses trophies or gets a persisted profile). */
  bIsBot: boolean;
}

export interface MatchOutcome {
  winner: 'a' | 'b' | 'draw';
  winReason: string;
  trophyDeltaA: number;
  trophyDeltaB: number;
}

/** Applies ranked trophy changes (if applicable) and persists the match to history. */
export function finalizeMatch(db: Db, input: MatchOutcomeInput): MatchOutcome {
  const { matchState, mode, playerAId, playerBId, playerAName, playerBName, bIsBot } = input;
  if (matchState.status !== 'finished' || !matchState.winner) {
    throw new Error('Cannot finalize an unfinished match');
  }

  let trophyDeltaA = 0;
  let trophyDeltaB = 0;

  if (mode === 'ranked') {
    const userA = getUserById(db, playerAId);
    if (userA && matchState.winner !== 'draw') {
      const aWon = matchState.winner === 'a';
      const newTrophiesA = applyRankedResult(userA.trophies, aWon);
      trophyDeltaA = newTrophiesA - userA.trophies;
      setTrophies(db, playerAId, newTrophiesA);

      if (!bIsBot) {
        const userB = getUserById(db, playerBId);
        if (userB) {
          const newTrophiesB = applyRankedResult(userB.trophies, !aWon);
          trophyDeltaB = newTrophiesB - userB.trophies;
          setTrophies(db, playerBId, newTrophiesB);
        }
      }
    }
  }

  recordMatch(db, {
    id: randomUUID(),
    mode,
    playerAId,
    playerBId,
    playerAName,
    playerBName,
    winner: matchState.winner,
    winReason: matchState.winReason ?? 'unknown',
    trophyDeltaA,
    trophyDeltaB,
  });

  return {
    winner: matchState.winner,
    winReason: matchState.winReason ?? 'unknown',
    trophyDeltaA,
    trophyDeltaB,
  };
}

/**
 * Public view of match state for one side: your own hand is fully visible, the opponent's hand
 * is only a count (hidden information), and both collected piles are fully visible since those
 * cards were revealed the moment they were won.
 */
export function serializeMatchView(state: MatchState, side: 'a' | 'b') {
  const self = side === 'a' ? state.a : state.b;
  const opponent = side === 'a' ? state.b : state.a;
  return {
    status: state.status,
    turnNumber: state.turnNumber,
    winner: state.winner,
    winReason: state.winReason,
    you: {
      hand: self.hand,
      deckCount: self.deck.length,
      collected: self.collected,
      discardedCount: self.discarded.length,
    },
    opponent: {
      handCount: opponent.hand.length,
      deckCount: opponent.deck.length,
      collected: opponent.collected,
      discardedCount: opponent.discarded.length,
    },
  };
}

export function arenaTierFor(db: Db, userId: string): number {
  const user = getUserById(db, userId);
  if (!user) throw new Error('User not found');
  return arenaForTrophies(user.trophies).tier;
}
