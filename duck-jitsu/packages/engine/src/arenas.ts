import { cardsUnlockedAtArena } from './catalog';
import type { ArenaDef } from './types';

type ArenaMeta = Omit<ArenaDef, 'unlocksCardIds'>;

const ARENA_META: ArenaMeta[] = [
  {
    tier: 0,
    id: 'pond-yard',
    name: 'Pond Yard',
    trophyRequirement: 0,
    description: 'Every duck starts here, splashing in the shallow end.',
  },
  {
    tier: 1,
    id: 'reed-grove',
    name: 'Reed Grove',
    trophyRequirement: 200,
    description: 'A quiet grove of reeds where new fledglings train.',
  },
  {
    tier: 2,
    id: 'bamboo-marsh',
    name: 'Bamboo Marsh',
    trophyRequirement: 400,
    description: 'Bamboo dojos rise from the marsh mud.',
  },
  {
    tier: 3,
    id: 'koi-dojo',
    name: 'Koi Pond Dojo',
    trophyRequirement: 700,
    description: 'Golden koi circle the sparring mat here.',
  },
  {
    tier: 4,
    id: 'frost-lake',
    name: 'Frost Lake',
    trophyRequirement: 1000,
    description: 'A half-frozen lake where the air bites back.',
  },
  {
    tier: 5,
    id: 'ember-delta',
    name: 'Ember Delta',
    trophyRequirement: 1400,
    description: 'Volcanic hot springs steam across the delta.',
  },
  {
    tier: 6,
    id: 'typhoon-bay',
    name: 'Typhoon Bay',
    trophyRequirement: 1900,
    description: 'Storm winds whip the bay into a frenzy.',
  },
  {
    tier: 7,
    id: 'golden-lagoon',
    name: 'Golden Lagoon',
    trophyRequirement: 2500,
    description: 'Only master ducks are invited to the lagoon.',
  },
];

export const ARENAS: ArenaDef[] = ARENA_META.map((meta) => ({
  ...meta,
  unlocksCardIds: cardsUnlockedAtArena(meta.tier).map((c) => c.id),
}));

export function arenaForTrophies(trophies: number): ArenaDef {
  let current = ARENAS[0];
  for (const arena of ARENAS) {
    if (trophies >= arena.trophyRequirement) {
      current = arena;
    }
  }
  return current;
}

export function nextArena(currentTier: number): ArenaDef | undefined {
  return ARENAS.find((a) => a.tier === currentTier + 1);
}
