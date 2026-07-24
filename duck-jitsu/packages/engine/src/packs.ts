import { cardsUnlockedUpToArena, STARTER_PACK_CARD_IDS } from './catalog';
import type { Rng } from './rng';
import { pick } from './rng';
import type { CardDef } from './types';

export type RarityBand = 'common' | 'rare' | 'epic' | 'legendary' | 'special';

export function rarityBand(card: CardDef): RarityBand {
  if (card.special) return 'special';
  if (card.rarity <= 3) return 'common';
  if (card.rarity <= 6) return 'rare';
  if (card.rarity <= 8) return 'epic';
  return 'legendary';
}

export interface PackOdds {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  special: number;
}

export interface PackDef {
  id: string;
  name: string;
  cardCount: number;
  /** Disclosed drop-rate percentages, shown to the player before purchase (store policy). */
  odds: PackOdds;
  currency: 'soft' | 'premium' | 'free';
  cost: number;
}

export const PACKS: Record<string, PackDef> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    cardCount: STARTER_PACK_CARD_IDS.length,
    odds: { common: 100, rare: 0, epic: 0, legendary: 0, special: 0 },
    currency: 'free',
    cost: 0,
  },
  basic: {
    id: 'basic',
    name: 'Pond Pack',
    cardCount: 4,
    odds: { common: 60, rare: 28, epic: 9, legendary: 2.5, special: 0.5 },
    currency: 'soft',
    cost: 100,
  },
  premium: {
    id: 'premium',
    name: 'Dojo Pack',
    cardCount: 6,
    odds: { common: 40, rare: 35, epic: 18, legendary: 5, special: 2 },
    currency: 'premium',
    cost: 50,
  },
};

const BAND_ORDER: RarityBand[] = ['special', 'legendary', 'epic', 'rare', 'common'];

function rollBand(odds: PackOdds, rng: Rng): RarityBand {
  const total = odds.common + odds.rare + odds.epic + odds.legendary + odds.special;
  let roll = rng() * total;
  const order: [RarityBand, number][] = [
    ['common', odds.common],
    ['rare', odds.rare],
    ['epic', odds.epic],
    ['legendary', odds.legendary],
    ['special', odds.special],
  ];
  for (const [band, weight] of order) {
    roll -= weight;
    if (roll <= 0) return band;
  }
  return 'common';
}

/**
 * The Starter Pack is a fixed, deterministic set -- no randomness, no locked cards.
 */
export function openStarterPack(): CardDef[] {
  const byId = new Map(cardsUnlockedUpToArena(0).map((c) => [c.id, c]));
  return STARTER_PACK_CARD_IDS.map((id) => {
    const card = byId.get(id);
    if (!card) throw new Error(`Starter pack card missing from catalog: ${id}`);
    return card;
  });
}

/**
 * Rolls the contents of a random pack. Only cards the player has unlocked via arena progress
 * are eligible -- locked cards never appear in packs. Falls back to the next lower band if the
 * rolled band has nothing eligible yet (e.g. no Special unlocked at this arena tier).
 */
export function openPack(packId: string, unlockedArenaTier: number, rng: Rng = Math.random): CardDef[] {
  const pack = PACKS[packId];
  if (!pack) throw new Error(`Unknown pack id: ${packId}`);
  if (packId === 'starter') return openStarterPack();

  const eligible = cardsUnlockedUpToArena(unlockedArenaTier);
  const byBand: Record<RarityBand, CardDef[]> = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
    special: [],
  };
  for (const card of eligible) byBand[rarityBand(card)].push(card);

  const results: CardDef[] = [];
  for (let i = 0; i < pack.cardCount; i++) {
    let band = rollBand(pack.odds, rng);
    // Fall back down the rarity ladder if this band has no eligible cards yet.
    while (byBand[band].length === 0) {
      const idx = BAND_ORDER.indexOf(band);
      if (idx >= BAND_ORDER.length - 1) {
        band = 'common';
        break;
      }
      band = BAND_ORDER[idx + 1];
    }
    results.push(pick(byBand[band], rng));
  }
  return results;
}
