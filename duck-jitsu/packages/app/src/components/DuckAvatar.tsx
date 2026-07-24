import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

export type AvatarAccessory = 'none' | 'bandana' | 'bow' | 'headband' | 'sunglasses' | 'cap';

interface Props {
  color?: string;
  accessory?: AvatarAccessory;
  size?: number;
  idle?: boolean;
  /** Freezes the duck mid-blink/wide-eyed, used for frost/scorch reaction poses. */
  expression?: 'normal' | 'dazed' | 'happy';
}

export function DuckAvatar({
  color = colors.cardColors.yellow,
  accessory = 'none',
  size = 96,
  idle = true,
  expression = 'normal',
}: Props) {
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (!idle) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blink.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 90 }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(blink);
    };
  }, [idle]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: idle ? bob.value : 0 }],
  }));

  const eyeScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: expression === 'dazed' ? 1 : blink.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* body */}
        <Ellipse cx={50} cy={68} rx={30} ry={22} fill={color} />
        {/* wing */}
        <Path d="M24 66c-6 4-8 12-4 18 6-2 12-8 14-16Z" fill={colors.textDark} opacity={0.08} />
        {/* head */}
        <Circle cx={50} cy={38} r={24} fill={color} />
        {/* beak */}
        <Path d="M62 40c8 0 14 3 14 6s-6 6-14 6c-3 0-5-3-5-6s2-6 5-6Z" fill={colors.gold} />
        {/* cheeks */}
        {expression === 'happy' && (
          <>
            <Circle cx={40} cy={44} r={3.5} fill="#FFA8A8" opacity={0.7} />
            <Circle cx={56} cy={44} r={3.5} fill="#FFA8A8" opacity={0.7} />
          </>
        )}
      </Svg>
      {/* eyes rendered as a separate animated SVG layer so blink only affects them */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, eyeScaleStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {expression === 'dazed' ? (
            <>
              <Path d="M38 32 44 38 38 44 M32 38 44 38" stroke={colors.textDark} strokeWidth={2.4} strokeLinecap="round" />
              <Path d="M56 32 62 38 56 44 M56 38 68 38" stroke={colors.textDark} strokeWidth={2.4} strokeLinecap="round" />
            </>
          ) : (
            <>
              <Circle cx={41} cy={36} r={3.6} fill={colors.textDark} />
              <Circle cx={59} cy={36} r={3.6} fill={colors.textDark} />
            </>
          )}
        </Svg>
      </Animated.View>
      <AccessoryLayer accessory={accessory} size={size} />
    </Animated.View>
  );
}

function AccessoryLayer({ accessory, size }: { accessory: AvatarAccessory; size: number }) {
  if (accessory === 'none') return null;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {accessory === 'bandana' && (
        <Path d="M26 30c10-8 38-8 48 0l-4 8c-12-6-28-6-40 0Z" fill={colors.fireDark} />
      )}
      {accessory === 'headband' && <Rect x={26} y={24} width={48} height={8} rx={4} fill={colors.water} />}
      {accessory === 'bow' && (
        <Path
          d="M38 20c-6-4-14 2-10 8 3 4 8 3 10 0 2 3 7 4 10 0 4-6-4-12-10-8Z"
          fill={colors.gem}
        />
      )}
      {accessory === 'cap' && <Path d="M22 30a28 16 0 0 1 56 0c-8-4-48-4-56 0Z" fill={colors.bamboo} />}
      {accessory === 'sunglasses' && (
        <>
          <Rect x={30} y={32} width={16} height={9} rx={4} fill={colors.textDark} />
          <Rect x={54} y={32} width={16} height={9} rx={4} fill={colors.textDark} />
          <Path d="M46 36h8" stroke={colors.textDark} strokeWidth={2} />
        </>
      )}
    </Svg>
  );
}
