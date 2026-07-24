import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { SpinWheelApi } from '../api/endpoints';
import type { SpinWheelSegment } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

const WHEEL_SIZE = 260;
const RADIUS = WHEEL_SIZE / 2;
const WEDGE_COLORS = [colors.fire, colors.water, colors.ice, colors.gold, colors.gem, colors.bamboo];
const SPIN_DURATION_MS = 3200;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SpinWheelScreen() {
  const navigation = useNavigation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [segments, setSegments] = useState<SpinWheelSegment[]>([]);
  const [claimable, setClaimable] = useState(false);
  const [hoursUntilNext, setHoursUntilNext] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const rotation = useSharedValue(0);

  useEffect(() => {
    SpinWheelApi.status()
      .then((res) => {
        setSegments(res.segments);
        setClaimable(res.claimable);
        setHoursUntilNext(res.hoursUntilNextSpin);
      })
      .catch(() => undefined);
  }, []);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  async function spin() {
    if (!claimable || spinning || segments.length === 0) return;
    setSpinning(true);
    setResultLabel(null);
    try {
      const res = await SpinWheelApi.spin();
      const index = segments.findIndex((s) => s.id === res.segment.id);
      const wedgeAngle = 360 / segments.length;
      const targetAngle = index * wedgeAngle + wedgeAngle / 2;
      // Spin several full rotations, then land the winning wedge under the top pointer.
      const finalRotation = 360 * 6 + (360 - targetAngle);
      rotation.value = withTiming(finalRotation, { duration: SPIN_DURATION_MS, easing: Easing.out(Easing.cubic) });

      setTimeout(() => {
        setResultLabel(res.segment.label);
        setProfile(res.profile);
        setClaimable(false);
        setHoursUntilNext(24);
        setSpinning(false);
      }, SPIN_DURATION_MS);
    } catch (err) {
      setSpinning(false);
      Alert.alert('Could not spin', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  return (
    <ScreenBackground>
      <View style={styles.centered}>
        <Reveal>
          <Text style={styles.backLink} onPress={() => navigation.goBack()} suppressHighlighting>
            ← Back
          </Text>
          <Text style={styles.title}>Spin Wheel</Text>
        </Reveal>

        <View style={styles.wheelWrap}>
          <View style={styles.pointer} />
          {segments.length > 0 && (
            <Animated.View style={wheelStyle}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
                {segments.map((segment, i) => {
                  const wedgeAngle = 360 / segments.length;
                  const start = i * wedgeAngle;
                  const end = start + wedgeAngle;
                  return (
                    <Path key={segment.id} d={wedgePath(RADIUS, RADIUS, RADIUS - 4, start, end)} fill={WEDGE_COLORS[i % WEDGE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  );
                })}
                {segments.map((segment, i) => {
                  const wedgeAngle = 360 / segments.length;
                  const mid = i * wedgeAngle + wedgeAngle / 2;
                  const labelPos = polarToCartesian(RADIUS, RADIUS, RADIUS * 0.62, mid);
                  return (
                    <SvgText
                      key={`${segment.id}-label`}
                      x={labelPos.x}
                      y={labelPos.y}
                      fontSize={11}
                      fontWeight="bold"
                      fill="#fff"
                      textAnchor="middle"
                    >
                      {segment.label}
                    </SvgText>
                  );
                })}
              </Svg>
            </Animated.View>
          )}
        </View>

        {resultLabel && <Text style={styles.resultText}>You won {resultLabel}!</Text>}
        {!claimable && !resultLabel && (
          <Text style={styles.cooldownText}>Come back in {Math.ceil(hoursUntilNext)}h for another spin</Text>
        )}

        <PrimaryButton title={spinning ? 'Spinning…' : 'Spin'} onPress={spin} disabled={!claimable} loading={spinning} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 20 },
  backLink: { color: '#fff', fontWeight: '700', marginBottom: 8, opacity: 0.85 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  wheelWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  pointer: {
    position: 'absolute',
    top: -6,
    zIndex: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.gold,
  },
  resultText: { color: colors.gold, fontWeight: '900', fontSize: 18 },
  cooldownText: { color: '#fff', fontWeight: '700', opacity: 0.85 },
});
