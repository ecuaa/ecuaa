import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PackArtHalf } from '../../components/PackArt';
import { colors } from '../../theme/colors';

const ART_RATIO = 1086 / 1448;
const PACK_HEIGHT = 260;
const PACK_WIDTH = PACK_HEIGHT * ART_RATIO;
const SPLIT_AT = PACK_HEIGHT * 0.36;
const TEAR_THRESHOLD = PACK_HEIGHT * 0.4;

interface Props {
  /** True while the pack is closed and waiting for the player's rip gesture. */
  interactive: boolean;
  onRipped: () => void;
}

/** The foil pack, torn open with a finger drag (or a tap, as a fallback). */
export function RipPackEnvelope({ interactive, onRipped }: Props) {
  const idleWobble = useSharedValue(0);
  const glow = useSharedValue(0.3);
  const dragY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const torn = useSharedValue(0);
  const bodyFade = useSharedValue(1);
  const bodyScale = useSharedValue(1);

  useEffect(() => {
    if (interactive) {
      idleWobble.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 260, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 260, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      glow.value = withRepeat(withSequence(withTiming(0.8, { duration: 550 }), withTiming(0.25, { duration: 550 })), -1, true);
    } else {
      idleWobble.value = withTiming(0, { duration: 150 });
    }
  }, [interactive]);

  function finishTear() {
    'worklet';
    torn.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
    dragY.value = withTiming(PACK_HEIGHT * 1.1, { duration: 380, easing: Easing.in(Easing.quad) });
    dragX.value = withTiming(PACK_WIDTH * 0.6, { duration: 380 });
    bodyFade.value = withDelay(160, withTiming(0, { duration: 260 }));
    bodyScale.value = withDelay(160, withTiming(0.85, { duration: 260 }));
  }

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
      dragX.value = e.translationX * 0.4;
    })
    .onEnd((e) => {
      if (dragY.value > TEAR_THRESHOLD || e.velocityY > 900) {
        finishTear();
        runOnJS(onRipped)();
      } else {
        dragY.value = withSpring(0, { damping: 14 });
        dragX.value = withSpring(0, { damping: 14 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .onEnd(() => {
      finishTear();
      runOnJS(onRipped)();
    });

  const gesture = Gesture.Race(pan, tap);

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: bodyFade.value,
    transform: [{ scale: bodyScale.value }, { rotate: `${idleWobble.value}deg` }],
    shadowColor: colors.gold,
    shadowOpacity: glow.value,
    shadowRadius: 20,
  }));

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dragY.value },
      { translateX: dragX.value },
      { rotate: `${dragY.value * 0.15 + torn.value * 25}deg` },
    ],
    opacity: 1 - torn.value * 0.4,
  }));

  const tearGlowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, dragY.value / TEAR_THRESHOLD) * 0.9,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, { width: PACK_WIDTH, height: PACK_HEIGHT }, wrapperStyle]}>
        <View style={[styles.slice, { top: SPLIT_AT }]}>
          <PackArtHalf width={PACK_WIDTH} height={PACK_HEIGHT} part="bottom" splitAt={SPLIT_AT} />
        </View>
        <Animated.View style={[styles.slice, { top: 0 }, topStyle]}>
          <PackArtHalf width={PACK_WIDTH} height={PACK_HEIGHT} part="top" splitAt={SPLIT_AT} />
        </Animated.View>
        <Animated.View style={[styles.tearGlow, { top: SPLIT_AT - 8, width: PACK_WIDTH }, tearGlowStyle]} pointerEvents="none" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  slice: { position: 'absolute', left: 0 },
  tearGlow: {
    position: 'absolute',
    left: 0,
    height: 16,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 16,
  },
});
