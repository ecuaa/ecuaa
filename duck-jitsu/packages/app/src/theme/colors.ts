/**
 * Duck Jitsu's original palette: a bright lily-pad dojo mat rather than any snow/penguin look.
 * Warm bamboo greens + teal water + coral fire + icy blue, kept rounded and kid-friendly.
 */
export const colors = {
  background: '#0E7490', // deep teal pond
  backgroundLight: '#22B8CF',
  mat: '#F5EFD8', // woven bamboo mat
  matShadow: '#DCC98F',
  bamboo: '#3F9142',
  bambooDark: '#276B31',

  fire: '#FF7A45',
  fireDark: '#D9480F',
  water: '#3B82F6',
  waterDark: '#1D4ED8',
  ice: '#7DD3FC',
  iceDark: '#0C8599',

  cardColors: {
    red: '#F03E3E',
    blue: '#3B82F6',
    green: '#3F9142',
    yellow: '#F2C94C',
    purple: '#9061F9',
    orange: '#FF7A45',
  } as Record<string, string>,

  gold: '#F2C94C',
  gem: '#9061F9',

  textDark: '#1F2933',
  textLight: '#FFFFFF',
  textMuted: '#5C6B73',

  success: '#2F9E44',
  danger: '#E03131',
  overlay: 'rgba(14, 46, 56, 0.72)',

  cardBackDark: '#0B4F5A',
};

export const elementColors: Record<'fire' | 'water' | 'ice', string> = {
  fire: colors.fire,
  water: colors.water,
  ice: colors.ice,
};

/** Karate rank colors, white through black. Black is trimmed in gold since it's the rarest. */
export const BELT_COLORS: Record<string, { base: string; trim: string; label: string }> = {
  white: { base: '#F8F9FA', trim: '#CED4DA', label: 'White Belt' },
  yellow: { base: '#F2C94C', trim: '#B8860B', label: 'Yellow Belt' },
  orange: { base: '#FF7A45', trim: '#D9480F', label: 'Orange Belt' },
  green: { base: '#3F9142', trim: '#276B31', label: 'Green Belt' },
  blue: { base: '#3B82F6', trim: '#1D4ED8', label: 'Blue Belt' },
  purple: { base: '#9061F9', trim: '#5F3DC4', label: 'Purple Belt' },
  brown: { base: '#8B5A2B', trim: '#5C3A1A', label: 'Brown Belt' },
  red: { base: '#F03E3E', trim: '#A61E1E', label: 'Red Belt' },
  black: { base: '#1F2933', trim: '#F2C94C', label: 'Black Belt' },
};
