import { getCardDef, SENSEI_CARD_LEVEL, SENSEI_DECK_CARD_IDS } from './catalog';
import { shuffle, type Rng } from './rng';
import type { OwnedCard, PlayableCard } from './types';

let instanceCounter = 0;

/** Resolves an owned card + catalog definition into a concrete, playable snapshot. */
export function toPlayableCard(owned: OwnedCard): PlayableCard {
  const def = getCardDef(owned.cardId);
  instanceCounter += 1;
  return {
    instanceId: `${owned.cardId}#${owned.level}#${instanceCounter}`,
    cardId: def.id,
    element: def.element,
    rarity: def.rarity,
    color: def.color,
    level: owned.level,
    special: def.special,
  };
}

export function buildDeck(ownedCards: OwnedCard[]): PlayableCard[] {
  return ownedCards.map(toPlayableCard);
}

/** Matches the starter pack size so every brand-new player can immediately queue for a match. */
export const MIN_DECK_SIZE = 6;
export const MAX_DECK_SIZE = 24;

/** Builds the Sensei's boss deck: every card maxed to level 10, in a fresh shuffled order. */
export function buildSenseiDeck(rng: Rng = Math.random): PlayableCard[] {
  const owned: OwnedCard[] = SENSEI_DECK_CARD_IDS.map((cardId) => ({
    cardId,
    level: SENSEI_CARD_LEVEL,
    duplicates: 0,
  }));
  return shuffle(buildDeck(owned), rng);
}
