import { cardsUnlockedUpToArena } from './catalog';
import { rarityBand } from './packs';
import { createRng, shuffle } from './rng';
import type { CardDef } from './types';

export const SHOP_OFFER_COUNT = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function currentShopDayIndex(now: Date = new Date()): number {
  return Math.floor(now.getTime() / MS_PER_DAY);
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const BAND_PRICE_SOFT: Record<string, number> = {
  common: 80,
  rare: 200,
  epic: 500,
  legendary: 1200,
  special: 3000,
};

export type ShopOfferKind = 'card' | 'duplicate_bundle' | 'currency_bundle';

export interface ShopOffer {
  id: string;
  kind: ShopOfferKind;
  cardId?: string;
  quantity?: number;
  currency: 'soft' | 'premium';
  price: number;
  /** Present only for premium-currency bundles purchasable with real money. */
  realMoneyPriceUsd?: number;
}

const CURRENCY_BUNDLES: ShopOffer[] = [
  { id: 'gold-small', kind: 'currency_bundle', quantity: 500, currency: 'soft', price: 0, realMoneyPriceUsd: 0.99 },
  { id: 'gold-large', kind: 'currency_bundle', quantity: 3000, currency: 'soft', price: 0, realMoneyPriceUsd: 4.99 },
  { id: 'gems-small', kind: 'currency_bundle', quantity: 80, currency: 'premium', price: 0, realMoneyPriceUsd: 1.99 },
  { id: 'gems-large', kind: 'currency_bundle', quantity: 500, currency: 'premium', price: 0, realMoneyPriceUsd: 9.99 },
];

/**
 * Builds this player's shop rotation for "today" (UTC day bucket + player id, so it refreshes
 * every 24h and is stable for all players until the next rollover). Only shows cards unlocked by
 * arena progress that the player doesn't already own; once everything unlocked is owned, falls
 * back to duplicate/upgrade bundles and currency bundles instead.
 */
export function getShopOffers(
  playerId: string,
  arenaTier: number,
  ownedCardIds: Set<string>,
  now: Date = new Date(),
): ShopOffer[] {
  const seed = hashString(`${playerId}:${currentShopDayIndex(now)}`);
  const rng = createRng(seed);

  const unowned = cardsUnlockedUpToArena(arenaTier).filter((c) => !ownedCardIds.has(c.id));

  if (unowned.length > 0) {
    const picks = shuffle(unowned, rng).slice(0, SHOP_OFFER_COUNT);
    return picks.map((card) => cardOffer(card));
  }

  const owned = cardsUnlockedUpToArena(arenaTier).filter((c) => ownedCardIds.has(c.id));
  const dupeOffers = shuffle(owned, rng)
    .slice(0, 2)
    .map((card) => duplicateOffer(card));
  const currencyOffer = shuffle(CURRENCY_BUNDLES, rng)[0];

  return [...dupeOffers, currencyOffer].slice(0, SHOP_OFFER_COUNT);
}

function cardOffer(card: CardDef): ShopOffer {
  const band = rarityBand(card);
  return {
    id: `card:${card.id}`,
    kind: 'card',
    cardId: card.id,
    currency: 'soft',
    price: BAND_PRICE_SOFT[band],
  };
}

function duplicateOffer(card: CardDef): ShopOffer {
  const band = rarityBand(card);
  return {
    id: `dupe:${card.id}`,
    kind: 'duplicate_bundle',
    cardId: card.id,
    quantity: 3,
    currency: 'soft',
    price: Math.round(BAND_PRICE_SOFT[band] * 0.4),
  };
}
