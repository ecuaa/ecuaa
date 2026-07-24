import type { CardColor, CardDef, Element } from './types';
import { CARD_COLORS, ELEMENTS } from './types';

const ELEMENT_NAMES: Record<Element, string[]> = {
  // Rank names by rarity band: [1-2, 3-4, 5-6, 7-8, 9-10]
  fire: ['Ember Duckling', 'Torch Teal', 'Blaze Mallard', 'Cinder Drake', 'Wildfire Sovereign'],
  water: ['Splash Duckling', 'Tide Teal', 'Rapids Mallard', 'Puddle Drake', 'Tsunami Sovereign'],
  ice: ['Frost Duckling', 'Glacier Teal', 'Blizzard Mallard', 'Hail Drake', 'Permafrost Sovereign'],
};

function rankName(element: Element, rarity: number): string {
  const band = Math.min(4, Math.floor((rarity - 1) / 2));
  return ELEMENT_NAMES[element][band];
}

/**
 * Basic (non-special) cards are generated systematically so every element unlocks
 * new colors and a rising rarity band as arenas progress -- this keeps the "3 same
 * element, different colors" win condition reachable early without hand-authoring
 * dozens of near-identical entries.
 */
function buildBasicCards(): CardDef[] {
  const cards: CardDef[] = [];
  const arenasCount = 8;
  for (let tier = 0; tier < arenasCount; tier++) {
    ELEMENTS.forEach((element, elementIndex) => {
      const colorIndex = (tier * 3 + elementIndex) % CARD_COLORS.length;
      const color: CardColor = CARD_COLORS[colorIndex];
      // Two color variants unlock per element per arena from tier 2 onward so
      // players accumulate the color diversity a winning set requires.
      const variantCount = tier === 0 ? 2 : 1;
      for (let v = 0; v < variantCount; v++) {
        const vColor = CARD_COLORS[(colorIndex + v * 2) % CARD_COLORS.length];
        const rarity = Math.min(10, 1 + tier + v);
        const id = `${element}-${vColor}-t${tier}-${v}`;
        cards.push({
          id,
          name: `${rankName(element, rarity)} (${capitalize(vColor)})`,
          element,
          rarity,
          color: vColor,
          special: false,
          unlockArena: tier,
          maxLevel: 3 + tier,
          levelUnlockArena: tier,
        });
      }
    });
  }
  return cards;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SPECIAL_CARDS: CardDef[] = [
  {
    id: 'special-cannonball-quack',
    name: 'Cannonball Quack',
    element: 'water',
    rarity: 8,
    color: 'blue',
    special: true,
    unlockArena: 2,
    maxLevel: 6,
    levelUnlockArena: 2,
    flavor: 'Belly-flops so hard it dents the dojo mat.',
    specialAnimation: 'cannonball-quack',
  },
  {
    id: 'special-phoenix-feather',
    name: 'Phoenix Feather',
    element: 'fire',
    rarity: 9,
    color: 'orange',
    special: true,
    unlockArena: 4,
    maxLevel: 7,
    levelUnlockArena: 4,
    flavor: 'A single molting feather that refuses to burn out.',
    specialAnimation: 'phoenix-feather',
  },
  {
    id: 'special-glacier-general',
    name: 'Glacier General',
    element: 'ice',
    rarity: 9,
    color: 'purple',
    special: true,
    unlockArena: 5,
    maxLevel: 7,
    levelUnlockArena: 5,
    flavor: 'Commands an army of icicle-armed ducklings.',
    specialAnimation: 'glacier-general',
  },
  {
    id: 'special-golden-mallard',
    name: 'Golden Mallard',
    element: 'fire',
    rarity: 10,
    color: 'yellow',
    special: true,
    unlockArena: 7,
    maxLevel: 8,
    levelUnlockArena: 7,
    flavor: 'Legend says it hatched from a solid-gold egg.',
    specialAnimation: 'golden-mallard',
  },
];

export const CARD_CATALOG: CardDef[] = [...buildBasicCards(), ...SPECIAL_CARDS];

export const CARD_CATALOG_BY_ID: Record<string, CardDef> = Object.fromEntries(
  CARD_CATALOG.map((c) => [c.id, c]),
);

export function getCardDef(cardId: string): CardDef {
  const def = CARD_CATALOG_BY_ID[cardId];
  if (!def) throw new Error(`Unknown card id: ${cardId}`);
  return def;
}

export function cardsUnlockedAtArena(tier: number): CardDef[] {
  return CARD_CATALOG.filter((c) => c.unlockArena === tier);
}

export function cardsUnlockedUpToArena(tier: number): CardDef[] {
  return CARD_CATALOG.filter((c) => c.unlockArena <= tier);
}

/** The small fixed set of basic, low-level cards every brand-new player receives. */
export const STARTER_PACK_CARD_IDS: string[] = cardsUnlockedAtArena(0).map((c) => c.id);

/**
 * Fixed, ordered decks for the guided tutorial's scripted practice match. The player's first two
 * plays each win on elemental advantage and, together, complete a one-of-each-element (distinct
 * color) set on turn 2 -- guaranteeing a win. Extra cards pad the hand to the normal deal size but
 * are never needed since the match ends after turn 2. See catalog.test.ts for the guarantee proof.
 */
export const TUTORIAL_PLAYER_DECK_IDS: string[] = [
  'fire-red-t0-0',
  'ice-purple-t0-1',
  'fire-green-t0-1',
  'water-blue-t0-0',
  'water-yellow-t0-1',
];

export const TUTORIAL_AI_DECK_IDS: string[] = [
  'ice-green-t0-0',
  'water-yellow-t0-1',
  'fire-red-t0-0',
  'ice-purple-t0-1',
  'fire-green-t0-1',
];

/** The Sensei's boss deck: nothing but Special Cards, three copies of each. */
export const SENSEI_DECK_CARD_IDS: string[] = [
  'special-cannonball-quack',
  'special-cannonball-quack',
  'special-cannonball-quack',
  'special-phoenix-feather',
  'special-phoenix-feather',
  'special-phoenix-feather',
  'special-glacier-general',
  'special-glacier-general',
  'special-glacier-general',
  'special-golden-mallard',
  'special-golden-mallard',
  'special-golden-mallard',
];

/** Every card in the Sensei's deck is maxed out, regardless of each card's normal level cap. */
export const SENSEI_CARD_LEVEL = 10;
