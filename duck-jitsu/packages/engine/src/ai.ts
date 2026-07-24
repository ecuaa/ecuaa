import type { Rng } from './rng';
import { weightedPick } from './rng';
import type { Element, PlayableCard } from './types';

/** The element that beats each given element (i.e. its "counter"). */
const COUNTERS: Record<Element, Element> = {
  fire: 'water',
  ice: 'fire',
  water: 'ice',
};

export interface AiDifficulty {
  /** Relative weight multiplier applied to cards that counter the opponent's last element. */
  counterBias: number;
  /** Relative weight multiplier applied to higher-rarity cards within the chosen element. */
  rarityBias: number;
}

export const AI_DIFFICULTIES: Record<'practice' | 'ranked_bot' | 'sensei', AiDifficulty> = {
  practice: { counterBias: 2.5, rarityBias: 1.05 },
  ranked_bot: { counterBias: 3.5, rarityBias: 1.15 },
  /** The Sensei: reads your last move hard and almost never misses a counter. */
  sensei: { counterBias: 40, rarityBias: 1.4 },
};

/**
 * Simple weighted decision tree: bias toward whichever element counters the opponent's most
 * recently played element, but keep enough randomness that the AI is beatable and not robotic.
 */
export function pickAiCard(
  hand: PlayableCard[],
  lastOpponentElement: Element | undefined,
  rng: Rng = Math.random,
  difficulty: AiDifficulty = AI_DIFFICULTIES.practice,
): PlayableCard {
  if (hand.length === 0) throw new Error('AI hand is empty');
  const counterElement = lastOpponentElement ? COUNTERS[lastOpponentElement] : undefined;

  const weighted = hand.map((card) => {
    let weight = 1;
    if (counterElement && card.element === counterElement) {
      weight *= difficulty.counterBias;
    }
    weight *= Math.pow(difficulty.rarityBias, card.rarity);
    return { item: card, weight };
  });

  return weightedPick(weighted, rng);
}

/**
 * Deterministic scripted play for the guided tutorial: always plays the front of its hand.
 * Since a hand only shrinks when its own owner plays from it, the next scripted card always
 * ends up at index 0 after the previous one is removed -- paired with an intentionally weak,
 * mismatched tutorial-only AI deck, this guarantees the new player wins their first practice
 * match.
 */
export function pickScriptedCard(hand: PlayableCard[]): PlayableCard {
  if (hand.length === 0) throw new Error('AI hand is empty');
  return hand[0];
}
