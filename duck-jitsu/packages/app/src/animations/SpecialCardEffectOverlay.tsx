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
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Props {
  specialAnimation: string;
  cardName: string;
  onDone: () => void;
}

const CAPTIONS: Record<string, string> = {
  'cannonball-quack': 'CANNONBALL QUACK!',
  'phoenix-feather': 'PHOENIX FEATHER!',
  'glacier-general': 'GLACIER GENERAL!',
  'golden-mallard': 'GOLDEN MALLARD!',
};

/** A dramatic, full-screen animation unique to each Special Card, distinct from element FX. */
export function SpecialCardEffectOverlay({ specialAnimation, cardName, onDone }: Props) {
  const progress = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 380, easing: Easing.out(Easing.exp) }),
      withDelay(650, withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
    shake.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(-1, { duration: 90 }),
      withTiming(1, { duration: 90 }),
      withTiming(0, { duration: 90 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.4 + progress.value * 0.6 },
      { rotate: `${shake.value * 4}deg` },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.55 }));

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.bg, bgStyle]} />
      <Animated.View style={style}>
        <SpecialArt id={specialAnimation} />
        <Text style={styles.caption}>{CAPTIONS[specialAnimation] ?? cardName.toUpperCase()}</Text>
      </Animated.View>
    </View>
  );
}

function SpecialArt({ id }: { id: string }) {
  switch (id) {
    case 'cannonball-quack':
      return (
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Circle cx={120} cy={140} r={60} fill={colors.water} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const angle = (i / 7) * Math.PI * 2;
            return (
              <Circle
                key={i}
                cx={120 + Math.cos(angle) * 90}
                cy={140 + Math.sin(angle) * 90}
                r={8}
                fill={colors.waterDark}
              />
            );
          })}
          <Circle cx={120} cy={90} r={26} fill={colors.gold} />
        </Svg>
      );
    case 'phoenix-feather':
      return (
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Path d="M120 30c30 30 30 90 0 150-30-60-30-120 0-150Z" fill={colors.fire} />
          <Path d="M120 60c14 22 14 60 0 100-14-40-14-78 0-100Z" fill={colors.gold} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Polygon
              key={i}
              points="120,200 130,220 110,220"
              fill={colors.fireDark}
              transform={`rotate(${(i - 2) * 20} 120 200)`}
            />
          ))}
        </Svg>
      );
    case 'glacier-general':
      return (
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Polygon points="120,30 150,110 220,120 150,130 120,210 90,130 20,120 90,110" fill={colors.ice} />
          <Circle cx={120} cy={120} r={30} fill={colors.iceDark} />
        </Svg>
      );
    case 'golden-mallard':
    default:
      return (
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Circle cx={120} cy={120} r={70} fill={colors.gold} />
          <Circle cx={120} cy={120} r={45} fill="#FFE066" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <Path
                key={i}
                d={`M120 120 L${120 + Math.cos(angle) * 100} ${120 + Math.sin(angle) * 100}`}
                stroke={colors.gold}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  bg: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  caption: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: colors.gold,
    marginTop: -10,
    textShadowColor: '#000',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
});
