import type { CardDef, OwnedCard } from './types';

const BASE_LEVEL_CAP = 3;

/** How many duplicate copies are required to go from `level` to `level + 1`. */
export function duplicatesRequiredForLevel(level: number): number {
  return level * 2;
}

/**
 * A card's level cap grows as the player advances past the arena where it unlocked, up to the
 * card's absolute maxLevel. This is how "reaching a new Arena unlocks access to higher level
 * versions of cards the player already has" is expressed.
 */
export function effectiveLevelCap(card: CardDef, playerArenaTier: number): number {
  const grown = BASE_LEVEL_CAP + Math.max(0, playerArenaTier - card.unlockArena);
  return Math.min(card.maxLevel, grown);
}

export interface LevelUpResult {
  canLevelUp: boolean;
  reason?: 'at-cap' | 'not-enough-duplicates';
  duplicatesNeeded?: number;
  newLevel?: number;
  remainingDuplicates?: number;
}

export function tryLevelUp(
  owned: OwnedCard,
  card: CardDef,
  playerArenaTier: number,
): LevelUpResult {
  const cap = effectiveLevelCap(card, playerArenaTier);
  if (owned.level >= cap) {
    return { canLevelUp: false, reason: 'at-cap' };
  }
  const needed = duplicatesRequiredForLevel(owned.level);
  if (owned.duplicates < needed) {
    return { canLevelUp: false, reason: 'not-enough-duplicates', duplicatesNeeded: needed };
  }
  return {
    canLevelUp: true,
    newLevel: owned.level + 1,
    remainingDuplicates: owned.duplicates - needed,
  };
}

export function applyLevelUp(owned: OwnedCard, result: LevelUpResult): OwnedCard {
  if (!result.canLevelUp || result.newLevel === undefined || result.remainingDuplicates === undefined) {
    throw new Error('Cannot apply an invalid level-up result');
  }
  return { ...owned, level: result.newLevel, duplicates: result.remainingDuplicates };
}
