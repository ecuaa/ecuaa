import { checkWinCondition, resolveOutOfCardsTiebreak, resolveTurn } from './resolve';
import type { PlayableCard, TurnResult, WinCheckResult } from './types';

export const STARTING_HAND_SIZE = 5;

export type MatchSide = 'a' | 'b';

export interface MatchPlayerState {
  id: string;
  deck: PlayableCard[];
  hand: PlayableCard[];
  collected: PlayableCard[];
  discarded: PlayableCard[];
}

export type MatchStatus = 'in_progress' | 'finished';
export type MatchWinReason = 'set-complete' | 'tiebreak-pile-size' | 'tiebreak-draw' | 'forfeit';

export interface MatchState {
  a: MatchPlayerState;
  b: MatchPlayerState;
  turnNumber: number;
  status: MatchStatus;
  winner?: MatchSide | 'draw';
  winReason?: MatchWinReason;
  winCheck?: WinCheckResult;
}

function dealPlayer(id: string, deck: PlayableCard[]): MatchPlayerState {
  const hand = deck.slice(0, STARTING_HAND_SIZE);
  const remainingDeck = deck.slice(STARTING_HAND_SIZE);
  return { id, deck: remainingDeck, hand, collected: [], discarded: [] };
}

export function createMatch(
  playerAId: string,
  deckA: PlayableCard[],
  playerBId: string,
  deckB: PlayableCard[],
): MatchState {
  return {
    a: dealPlayer(playerAId, deckA),
    b: dealPlayer(playerBId, deckB),
    turnNumber: 0,
    status: 'in_progress',
  };
}

export interface PlayTurnResult {
  state: MatchState;
  turnResult: TurnResult;
}

function removeFromHand(player: MatchPlayerState, instanceId: string): PlayableCard {
  const idx = player.hand.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) {
    throw new Error(`Card ${instanceId} is not in ${player.id}'s hand`);
  }
  const [card] = player.hand.splice(idx, 1);
  return card;
}

function refillHand(player: MatchPlayerState): void {
  if (player.deck.length > 0) {
    player.hand.push(player.deck.shift()!);
  }
}

/**
 * Applies one simultaneous-reveal turn to the match state (mutates and returns a fresh state
 * object). Throws if the match is already finished or either card isn't actually in hand.
 */
export function playTurn(
  state: MatchState,
  instanceIdA: string,
  instanceIdB: string,
): PlayTurnResult {
  if (state.status === 'finished') {
    throw new Error('Match is already finished');
  }

  // Work on a deep-enough clone so callers can treat state as immutable.
  const next: MatchState = {
    a: cloneSide(state.a),
    b: cloneSide(state.b),
    turnNumber: state.turnNumber + 1,
    status: 'in_progress',
  };

  const cardA = removeFromHand(next.a, instanceIdA);
  const cardB = removeFromHand(next.b, instanceIdB);

  const turnResult = resolveTurn(cardA, cardB);

  if (turnResult.outcome === 'draw') {
    next.a.discarded.push(cardA);
    next.b.discarded.push(cardB);
  } else {
    const winnerSide = turnResult.outcome === 'a' ? next.a : next.b;
    winnerSide.collected.push(cardA, cardB);
  }

  refillHand(next.a);
  refillHand(next.b);

  if (turnResult.outcome !== 'draw') {
    const winnerSide = turnResult.outcome === 'a' ? next.a : next.b;
    const winCheck = checkWinCondition(winnerSide.collected);
    if (winCheck.won) {
      next.status = 'finished';
      next.winner = turnResult.outcome;
      next.winReason = 'set-complete';
      next.winCheck = winCheck;
      return { state: next, turnResult };
    }
  }

  // Decks aren't guaranteed to be the same size (e.g. a player's own small collection vs. a
  // fuller AI deck), so one side can run out of cards to play well before the other. The match
  // must end as soon as *either* side can no longer take a turn -- waiting for both would stall
  // forever once the shorter-decked side has nothing left in hand or deck.
  const eitherOutOfCards =
    (next.a.hand.length === 0 && next.a.deck.length === 0) ||
    (next.b.hand.length === 0 && next.b.deck.length === 0);

  if (eitherOutOfCards) {
    const tiebreak = resolveOutOfCardsTiebreak(next.a.collected, next.b.collected);
    next.status = 'finished';
    next.winner = tiebreak;
    next.winReason = tiebreak === 'draw' ? 'tiebreak-draw' : 'tiebreak-pile-size';
  }

  return { state: next, turnResult };
}

function cloneSide(side: MatchPlayerState): MatchPlayerState {
  return {
    id: side.id,
    deck: [...side.deck],
    hand: [...side.hand],
    collected: [...side.collected],
    discarded: [...side.discarded],
  };
}
