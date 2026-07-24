import { describe, expect, it } from 'vitest';
import { pickScriptedCard } from './ai';
import { getCardDef, TUTORIAL_AI_DECK_IDS, TUTORIAL_PLAYER_DECK_IDS } from './catalog';
import { toPlayableCard } from './deck';
import { createMatch, playTurn } from './match';
import type { OwnedCard } from './types';

function ownedFromIds(ids: string[]): OwnedCard[] {
  return ids.map((cardId) => ({ cardId, level: 1, duplicates: 0 }));
}

describe('scripted tutorial match', () => {
  it('always lets the player win by turn 2, regardless of AI play order elsewhere in the deck', () => {
    const playerDeck = ownedFromIds(TUTORIAL_PLAYER_DECK_IDS).map(toPlayableCard);
    const aiDeck = ownedFromIds(TUTORIAL_AI_DECK_IDS).map(toPlayableCard);

    let state = createMatch('player', playerDeck, 'ai', aiDeck);
    expect(state.a.hand[0].cardId).toBe(getCardDef('fire-red-t0-0').id);
    expect(state.a.hand[1].cardId).toBe(getCardDef('ice-purple-t0-1').id);

    // Turn 1: player plays hand[0] (fire), AI plays its scripted front card (ice) -> fire wins.
    const aiCard1 = pickScriptedCard(state.b.hand);
    let turn = playTurn(state, state.a.hand[0].instanceId, aiCard1.instanceId);
    expect(turn.turnResult.outcome).toBe('a');
    state = turn.state;
    expect(state.status).toBe('in_progress');

    // Turn 2: player plays hand[1] (ice, now shifted to hand[0]), AI plays its new scripted
    // front card (water) -> ice wins, and the combined collected pile completes a
    // one-of-each-element distinct-color set.
    const aiCard2 = pickScriptedCard(state.b.hand);
    turn = playTurn(state, state.a.hand[0].instanceId, aiCard2.instanceId);
    expect(turn.turnResult.outcome).toBe('a');
    state = turn.state;

    expect(state.status).toBe('finished');
    expect(state.winner).toBe('a');
    expect(state.winReason).toBe('set-complete');
  });
});
