import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Element } from '@duck-jitsu/engine';
import { colors } from '../theme/colors';

interface Props {
  element: Element;
  onDone: () => void;
}

const COPY: Record<Element, string> = {
  water: 'SPLASH!',
  fire: 'SCORCHED!',
  ice: 'FROSTED!',
};

/**
 * Full-screen reaction FX for a standard elemental turn win: a splash burst for water, a
 * comedic scorch/steam puff for fire, and a frost crystallization for ice.
 */
export function WinEffectOverlay({ element, onDone }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(1.5)) }),
      withDelay(500, withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={style}>
        <ElementBurst element={element} />
        <Text style={[styles.caption, { color: colors[element] }]}>{COPY[element]}</Text>
      </Animated.View>
    </View>
  );
}

function ElementBurst({ element }: { element: Element }) {
  if (element === 'water') {
    return (
      <Svg width={220} height={220} viewBox="0 0 220 220">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = 110 + Math.cos(angle) * 70;
          const y = 110 + Math.sin(angle) * 70;
          return <Circle key={i} cx={x} cy={y} r={14} fill={colors.water} opacity={0.85} />;
        })}
        <Circle cx={110} cy={110} r={40} fill={colors.waterDark} />
      </Svg>
    );
  }
  if (element === 'fire') {
    return (
      <Svg width={220} height={220} viewBox="0 0 220 220">
        <Circle cx={110} cy={110} r={50} fill={colors.fire} opacity={0.9} />
        {[0, 1, 2, 3].map((i) => (
          <Circle
            key={i}
            cx={110 + (i - 1.5) * 24}
            cy={70 - i * 6}
            r={10}
            fill="#B0B0B0"
            opacity={0.5}
          />
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Circle cx={110} cy={110} r={54} fill={colors.ice} opacity={0.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Path
            key={i}
            d={`M110 110 L${110 + Math.cos(angle) * 60} ${110 + Math.sin(angle) * 60}`}
            stroke={colors.iceDark}
            strokeWidth={5}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  caption: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    marginTop: -30,
    textShadowColor: '#00000040',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 2 },
  },
});
