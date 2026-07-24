import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import type { RarityBand } from '@duck-jitsu/engine';
import { CardBack, GameCard } from '../../components/GameCard';
import type { RevealedCard } from '../../api/types';
import { colors } from '../../theme/colors';
import { FlipCard } from '../../components/FlipCard';
import { playSfx } from '../../sound/soundManager';

const BAND_COPY: Record<RarityBand, string> = {
  common: 'New Card',
  rare: 'Rare Card!',
  epic: 'Epic Card!!',
  legendary: 'LEGENDARY!',
  special: 'SPECIAL CARD!!',
};

export function RevealCard({ card, onContinue }: { card: RevealedCard; onContinue: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const glow = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true);
      playSfx('cardFlip');
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!flipped) return;
    const dramatic = card.rarityBand === 'epic' || card.rarityBand === 'legendary' || card.rarityBand === 'special';
    if (dramatic) {
      glow.value = withDelay(
        420,
        withRepeat(withSequence(withTiming(1, { duration: 400, easing: Easing.out(Easing.exp) }), withTiming(0.4, { duration: 400 })), 3, true),
      );
    }
  }, [flipped]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const isDramatic = card.rarityBand === 'legendary' || card.rarityBand === 'special';

  return (
    <View style={styles.wrapper}>
      {isDramatic && (
        <Animated.View style={[styles.burst, glowStyle]} pointerEvents="none">
          <Svg width={260} height={260} viewBox="0 0 260 260">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <Circle
                  key={i}
                  cx={130 + Math.cos(angle) * 100}
                  cy={130 + Math.sin(angle) * 100}
                  r={10}
                  fill={colors.gold}
                />
              );
            })}
          </Svg>
        </Animated.View>
      )}

      <FlipCard
        revealed={flipped}
        back={<CardBack size="large" />}
        front={
          <GameCard
            card={{
              instanceId: card.id,
              cardId: card.id,
              element: card.element,
              rarity: card.rarity,
              color: card.color,
              level: 1,
              special: card.special,
            }}
            size="large"
          />
        }
      />

      {flipped && (
        <Animated.View style={[styles.captionWrap]}>
          <Text style={[styles.caption, card.rarityBand === 'special' && styles.captionSpecial]}>{BAND_COPY[card.rarityBand]}</Text>
          <Text style={styles.cardName}>{card.name}</Text>
          <Pressable onPress={onContinue} style={styles.nextButton}>
            <Text style={styles.nextText}>Tap to continue</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute' },
  captionWrap: { alignItems: 'center', marginTop: 18, gap: 6 },
  caption: { color: colors.gold, fontWeight: '900', fontSize: 20 },
  captionSpecial: { fontSize: 24 },
  cardName: { color: '#fff', fontWeight: '700' },
  nextButton: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: '#ffffff22', borderRadius: 12 },
  nextText: { color: '#fff', fontWeight: '700' },
});
