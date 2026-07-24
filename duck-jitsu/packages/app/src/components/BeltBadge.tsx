import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { BeltColor } from '@duck-jitsu/engine';
import { BELT_COLORS } from '../theme/colors';

interface Props {
  belt: BeltColor;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export function BeltBadge({ belt, size = 'medium', showLabel = true }: Props) {
  const palette = BELT_COLORS[belt] ?? BELT_COLORS.white;
  const isBlack = belt === 'black';
  const shine = useSharedValue(-1);

  useEffect(() => {
    shine.value = withDelay(
      400,
      withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), withTiming(-1, { duration: 0 })), -1, false),
    );
  }, []);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shine.value * 40 }, { rotate: '20deg' }],
    opacity: isBlack ? 0.5 : 0.35,
  }));

  const dims = size === 'small' ? { w: 44, h: 16 } : { w: 64, h: 22 };

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.strap,
          { width: dims.w, height: dims.h, backgroundColor: palette.base, borderColor: palette.trim },
        ]}
      >
        <View style={styles.shineClip}>
          <Animated.View style={[styles.shine, shineStyle]} />
        </View>
        <View style={[styles.knot, { backgroundColor: palette.trim }]} />
      </View>
      {showLabel && <Text style={[styles.label, isBlack && styles.labelBlack]}>{palette.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strap: {
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shineClip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  shine: { position: 'absolute', top: -10, bottom: -10, width: 14, backgroundColor: '#ffffff' },
  knot: { position: 'absolute', left: '50%', top: '15%', bottom: '15%', width: 6, marginLeft: -3, borderRadius: 3 },
  label: { fontWeight: '800', fontSize: 13, color: '#1F2933' },
  labelBlack: { color: '#1F2933' },
});
