import {
  addXp,
  applyRankedResult,
  arenaForTrophies,
  buildDeck,
  cardsUnlockedUpToArena,
  createRng,
  shuffle,
  xpFor,
  type MatchState,
  type OwnedCard,
  type PlayableCard,
} from '@duck-jitsu/engine';
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { bumpMissionsOfType } from './missionProgress';
import { recordMatch } from './repo/matches';
import { getOwnedCards } from './repo/ownedCards';
import { addCurrency, getUserById, setTrophies, setXpAndLevel } from './repo/users';

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
  mode: 'casual' | 'ranked' | 'practice' | 'sensei';
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
  softCurrencyDeltaA: number;
  softCurrencyDeltaB: number;
  xpGainedA: number;
  xpGainedB: number;
  leveledUpA: boolean;
  leveledUpB: boolean;
}

/** Soft-currency payout per match, by mode and result -- this is the game's core earn loop. */
const SOFT_CURRENCY_REWARD: Record<MatchOutcomeInput['mode'], { win: number; loss: number; draw: number }> = {
  practice: { win: 20, loss: 5, draw: 10 },
  casual: { win: 40, loss: 15, draw: 20 },
  ranked: { win: 60, loss: 20, draw: 30 },
  /** Beating the Sensei is the biggest single payout in the game -- losing still pays a little. */
  sensei: { win: 1000, loss: 25, draw: 25 },
};

function softCurrencyFor(mode: MatchOutcomeInput['mode'], result: 'win' | 'loss' | 'draw'): number {
  return SOFT_CURRENCY_REWARD[mode][result];
}

/** Applies ranked trophy changes and match-earned soft currency, and persists match history. */
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

  const resultFor = (side: 'a' | 'b'): 'win' | 'loss' | 'draw' => {
    if (matchState.winner === 'draw') return 'draw';
    return matchState.winner === side ? 'win' : 'loss';
  };

  const softCurrencyDeltaA = softCurrencyFor(mode, resultFor('a'));
  addCurrency(db, playerAId, 'soft', softCurrencyDeltaA);

  let softCurrencyDeltaB = 0;
  if (!bIsBot) {
    softCurrencyDeltaB = softCurrencyFor(mode, resultFor('b'));
    addCurrency(db, playerBId, 'soft', softCurrencyDeltaB);
  }

  const { xpGained: xpGainedA, leveledUp: leveledUpA } = awardXp(db, playerAId, mode, resultFor('a'));
  bumpMissionsOfType(db, playerAId, 'play_matches');
  if (resultFor('a') === 'win') bumpMissionsOfType(db, playerAId, 'win_matches');

  let xpGainedB = 0;
  let leveledUpB = false;
  if (!bIsBot) {
    ({ xpGained: xpGainedB, leveledUp: leveledUpB } = awardXp(db, playerBId, mode, resultFor('b')));
    bumpMissionsOfType(db, playerBId, 'play_matches');
    if (resultFor('b') === 'win') bumpMissionsOfType(db, playerBId, 'win_matches');
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
    softCurrencyDeltaA,
    softCurrencyDeltaB,
    xpGainedA,
    xpGainedB,
    leveledUpA,
    leveledUpB,
  };
}

function awardXp(
  db: Db,
  userId: string,
  mode: MatchOutcomeInput['mode'],
  result: 'win' | 'loss' | 'draw',
): { xpGained: number; leveledUp: boolean } {
  const user = getUserById(db, userId);
  if (!user) return { xpGained: 0, leveledUp: false };
  const gained = xpFor(mode, result);
  const next = addXp({ level: user.level, xp: user.xp }, gained);
  setXpAndLevel(db, userId, next.xp, next.level);
  return { xpGained: gained, leveledUp: next.leveledUp };
}

export type RelativeOutcome = 'you' | 'opponent' | 'draw';

/** Translates an absolute a/b/draw result into "you"/"opponent"/"draw" for one socket's side. */
export function relativeOutcome(outcome: 'a' | 'b' | 'draw', side: 'a' | 'b'): RelativeOutcome {
  if (outcome === 'draw') return 'draw';
  return outcome === side ? 'you' : 'opponent';
}

export interface PersonalizedOutcome {
  winner: RelativeOutcome;
  winReason: string;
  trophyDelta: number;
  softCurrencyDelta: number;
  xpGained: number;
  leveledUp: boolean;
}

export function personalizeOutcome(outcome: MatchOutcome, side: 'a' | 'b'): PersonalizedOutcome {
  return {
    winner: relativeOutcome(outcome.winner, side),
    winReason: outcome.winReason,
    trophyDelta: side === 'a' ? outcome.trophyDeltaA : outcome.trophyDeltaB,
    softCurrencyDelta: side === 'a' ? outcome.softCurrencyDeltaA : outcome.softCurrencyDeltaB,
    xpGained: side === 'a' ? outcome.xpGainedA : outcome.xpGainedB,
    leveledUp: side === 'a' ? outcome.leveledUpA : outcome.leveledUpB,
  };
}

/**
 * Public view of match state for one side: your own hand is fully visible, the opponent's hand
 * is only a count (hidden information), and both collected piles are fully visible since those
 * cards were revealed the moment they were won. `winner` is expressed relative to this side
 * ("you"/"opponent"/"draw") so client code never has to reason about absolute a/b sides.
 */
export function serializeMatchView(state: MatchState, side: 'a' | 'b') {
  const self = side === 'a' ? state.a : state.b;
  const opponent = side === 'a' ? state.b : state.a;
  return {
    status: state.status,
    turnNumber: state.turnNumber,
    winner: state.winner ? relativeOutcome(state.winner, side) : undefined,
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
