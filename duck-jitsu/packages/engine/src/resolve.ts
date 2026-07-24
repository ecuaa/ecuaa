import type { Element, PlayableCard, TurnResult, WinCheckResult } from './types';

/** Element that each element beats. Water > Fire > Ice > Water. */
const BEATS: Record<Element, Element> = {
  water: 'fire',
  fire: 'ice',
  ice: 'water',
};

export function resolveTurn(cardA: PlayableCard, cardB: PlayableCard): TurnResult {
  if (cardA.element !== cardB.element) {
    if (BEATS[cardA.element] === cardB.element) {
      return { outcome: 'a', reason: 'element-advantage', cardA, cardB };
    }
    return { outcome: 'b', reason: 'element-advantage', cardA, cardB };
  }

  // Same element: compare rarity, then level as a tiebreak.
  if (cardA.rarity !== cardB.rarity) {
    return {
      outcome: cardA.rarity > cardB.rarity ? 'a' : 'b',
      reason: 'higher-rarity',
      cardA,
      cardB,
    };
  }

  if (cardA.level !== cardB.level) {
    return {
      outcome: cardA.level > cardB.level ? 'a' : 'b',
      reason: 'higher-level',
      cardA,
      cardB,
    };
  }

  return { outcome: 'draw', reason: 'full-tie-draw', cardA, cardB };
}

/**
 * A player wins immediately when their collected pile contains either:
 *  - three cards of the same element, each a different color, or
 *  - one card of each element, each a different color.
 */
export function checkWinCondition(collectedPile: PlayableCard[]): WinCheckResult {
  const byElement: Record<Element, PlayableCard[]> = { fire: [], water: [], ice: [] };
  for (const card of collectedPile) {
    byElement[card.element].push(card);
  }

  for (const element of Object.keys(byElement) as Element[]) {
    const combo = pickDistinctColors(byElement[element], 3);
    if (combo) {
      return { won: true, reason: 'three-of-element', element, winningCards: combo };
    }
  }

  const oneOfEach = pickOneOfEachElementDistinctColors(byElement);
  if (oneOfEach) {
    return { won: true, reason: 'one-of-each-element', winningCards: oneOfEach };
  }

  return { won: false };
}

/** Finds `count` cards from a single-element group with pairwise-distinct colors, if possible. */
function pickDistinctColors(cards: PlayableCard[], count: number): PlayableCard[] | null {
  const seenColors = new Map<string, PlayableCard>();
  for (const card of cards) {
    if (!seenColors.has(card.color)) {
      seenColors.set(card.color, card);
    }
  }
  if (seenColors.size >= count) {
    return Array.from(seenColors.values()).slice(0, count);
  }
  return null;
}

/** Tries to find one card per element such that all three chosen colors differ. */
function pickOneOfEachElementDistinctColors(
  byElement: Record<Element, PlayableCard[]>,
): PlayableCard[] | null {
  const { fire, water, ice } = byElement;
  if (fire.length === 0 || water.length === 0 || ice.length === 0) return null;

  // One representative card per color, per element, keeps this small even with many duplicates.
  const uniqueByColor = (cards: PlayableCard[]) => {
    const map = new Map<string, PlayableCard>();
    for (const c of cards) if (!map.has(c.color)) map.set(c.color, c);
    return Array.from(map.values());
  };

  for (const f of uniqueByColor(fire)) {
    for (const w of uniqueByColor(water)) {
      if (w.color === f.color) continue;
      for (const i of uniqueByColor(ice)) {
        if (i.color === f.color || i.color === w.color) continue;
        return [f, w, i];
      }
    }
  }
  return null;
}

export type MatchTiebreakResult = 'a' | 'b' | 'draw';

export function resolveOutOfCardsTiebreak(
  pileA: PlayableCard[],
  pileB: PlayableCard[],
): MatchTiebreakResult {
  if (pileA.length > pileB.length) return 'a';
  if (pileB.length > pileA.length) return 'b';
  return 'draw';
}
