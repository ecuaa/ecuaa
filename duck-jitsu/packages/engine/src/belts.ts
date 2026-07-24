export type BeltColor =
  | 'white'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'red'
  | 'black';

/** One belt per arena tier, in classic karate rank order. Index = arena tier. */
export const ARENA_BELTS: BeltColor[] = [
  'white',
  'yellow',
  'orange',
  'green',
  'blue',
  'purple',
  'brown',
  'red',
];

export function beltForArenaTier(tier: number): BeltColor {
  return ARENA_BELTS[Math.max(0, Math.min(tier, ARENA_BELTS.length - 1))];
}

/**
 * The Black Belt is not earned through arena progress at all -- it is awarded only for
 * defeating the Sensei, the game's hardest boss encounter. Every other belt tracks arena tier.
 */
export function playerBelt(arenaTier: number, hasDefeatedSensei: boolean): BeltColor {
  return hasDefeatedSensei ? 'black' : beltForArenaTier(arenaTier);
}
