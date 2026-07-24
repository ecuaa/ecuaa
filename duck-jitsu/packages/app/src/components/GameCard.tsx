import { StyleSheet, Text, View } from 'react-native';
import type { PlayableCard } from '@duck-jitsu/engine';
import { CardIllustration } from './CardIllustration';
import { colors, elementColors } from '../theme/colors';
import { ElementIcon } from './ElementIcon';

interface Props {
  card: PlayableCard;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  dimmed?: boolean;
  /** Overrides the illustrated-art prototype gate below -- used to A/B the two looks side by side. */
  illustrated?: boolean;
}

const SIZES = {
  small: { width: 54, height: 76, radius: 10, font: 16 },
  medium: { width: 76, height: 104, radius: 12, font: 22 },
  large: { width: 108, height: 148, radius: 16, font: 30 },
};

// Prototype: only these two cards use the new illustrated art style, so it can be
// compared against the plain icon look before rolling it out to the full catalog.
const ILLUSTRATED_DEMO_CARD_IDS = new Set(['fire-red-t0-0', 'special-golden-mallard']);

export function GameCard({ card, size = 'medium', selected, dimmed, illustrated }: Props) {
  const dims = SIZES[size];
  const accent = elementColors[card.element];
  const colorDot = colors.cardColors[card.color] ?? colors.textMuted;
  const showIllustration = illustrated ?? ILLUSTRATED_DEMO_CARD_IDS.has(card.cardId);

  return (
    <View
      style={[
        styles.card,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: dims.radius,
          borderColor: card.special ? colors.gold : accent,
          borderWidth: card.special ? 3 : 2,
          opacity: dimmed ? 0.4 : 1,
          transform: [{ translateY: selected ? -10 : 0 }, { scale: selected ? 1.06 : 1 }],
        },
        card.special && styles.specialGlow,
      ]}
    >
      {showIllustration && (
        <CardIllustration element={card.element} color={card.color} special={card.special} width={dims.width} height={dims.height} />
      )}
      <View style={[styles.topBar, showIllustration ? styles.topBarOverlay : { backgroundColor: accent }]}>
        <Text style={[styles.rarity, { fontSize: dims.font * 0.42 }]}>{card.rarity}</Text>
        <View style={[styles.colorDot, { backgroundColor: colorDot }]} />
      </View>
      {!showIllustration && (
        <View style={styles.body}>
          <ElementIcon element={card.element} size={dims.font} />
        </View>
      )}
      <View style={[styles.levelRow, showIllustration && styles.levelRowOverlay]}>
        {Array.from({ length: Math.min(card.level, 6) }).map((_, i) => (
          <View key={i} style={styles.levelPip} />
        ))}
      </View>
    </View>
  );
}

export function CardBack({ size = 'medium' }: { size?: Props['size'] }) {
  const dims = SIZES[size ?? 'medium'];
  return (
    <View
      style={[
        styles.card,
        styles.cardBack,
        { width: dims.width, height: dims.height, borderRadius: dims.radius },
      ]}
    >
      <Text style={[styles.monogram, { fontSize: dims.font }]}>DJ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.textLight,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  specialGlow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  topBarOverlay: { backgroundColor: 'rgba(0,0,0,0.32)' },
  rarity: { color: colors.textLight, fontWeight: '800' },
  colorDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: '#fff' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  levelRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, paddingBottom: 4 },
  levelRowOverlay: { backgroundColor: 'rgba(0,0,0,0.28)', paddingTop: 3, borderRadius: 6, marginHorizontal: 4, marginBottom: 3 },
  levelPip: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  cardBack: {
    backgroundColor: colors.cardBackDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.gold,
    borderWidth: 2,
  },
  monogram: { color: colors.gold, fontWeight: '900' },
});
