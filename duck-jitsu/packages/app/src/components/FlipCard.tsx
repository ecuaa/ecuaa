import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
  revealed: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  durationMs?: number;
}

/** A card that flips from its back face to its front face when `revealed` becomes true. */
export function FlipCard({ revealed, front, back, durationMs = 420 }: Props) {
  const progress = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(revealed ? 1 : 0, { duration: durationMs });
  }, [revealed]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${(1 - progress.value) * 180}deg` }],
    opacity: progress.value > 0.5 ? 1 : 0,
    position: 'absolute',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${progress.value * -180}deg` }],
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  return (
    <Animated.View style={styles.wrapper}>
      <Animated.View style={backStyle}>{back}</Animated.View>
      <Animated.View style={frontStyle}>{front}</Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
});
