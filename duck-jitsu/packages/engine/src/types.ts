export type Element = 'fire' | 'water' | 'ice';

export const ELEMENTS: Element[] = ['fire', 'water', 'ice'];

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export const CARD_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

/** Static definition of a card as it exists in the game's catalog (not owned by anyone yet). */
export interface CardDef {
  id: string;
  name: string;
  element: Element;
  /** Rarity/power number, 1 (common) - 10 (legendary). Used to break element ties. */
  rarity: number;
  color: CardColor;
  /** Special Cards trigger a unique full-screen win animation and are gated/rare. */
  special: boolean;
  /** Minimum arena tier (index into ARENAS) required to unlock this card at all. */
  unlockArena: number;
  /** Highest level this card may be upgraded to; higher arenas raise the effective cap. */
  maxLevel: number;
  /** Arena tier required before the card may be leveled beyond level 1. */
  levelUnlockArena?: number;
  flavor?: string;
  /** Name of a client-side animation to play when this special card wins a turn. */
  specialAnimation?: string;
}

/** A card instance owned by a player: a reference to a CardDef plus progression state. */
export interface OwnedCard {
  cardId: string;
  level: number;
  /** Total copies collected historically (duplicates), used to fund level-ups. */
  duplicates: number;
}

/** A concrete card as played in a match (catalog data resolved + level snapshot). */
export interface PlayableCard {
  instanceId: string;
  cardId: string;
  element: Element;
  rarity: number;
  color: CardColor;
  level: number;
  special: boolean;
}

export type TurnOutcome = 'a' | 'b' | 'draw';

export interface TurnResult {
  outcome: TurnOutcome;
  reason: TurnReason;
  cardA: PlayableCard;
  cardB: PlayableCard;
}

export type TurnReason =
  | 'element-advantage'
  | 'higher-rarity'
  | 'higher-level'
  | 'full-tie-draw';

export interface WinCheckResult {
  won: boolean;
  reason?: 'three-of-element' | 'one-of-each-element';
  /** The element that completed the "three of a kind" set, if applicable. */
  element?: Element;
  /** The cards that satisfy the winning set. */
  winningCards?: PlayableCard[];
}

export interface ArenaDef {
  tier: number;
  id: string;
  name: string;
  trophyRequirement: number;
  /** Card ids newly unlocked for ownership at this arena. */
  unlocksCardIds: string[];
  description?: string;
}
