import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface Props {
  unlocked: boolean;
  defeated: boolean;
  onPress: () => void;
}

export function SenseiBanner({ unlocked, defeated, onPress }: Props) {
  const glow = useSharedValue(0.4);

  useEffect(() => {
    if (!unlocked) return;
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.4, { duration: 900 })), -1, true);
  }, [unlocked]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: unlocked ? glow.value : 0,
  }));

  return (
    <Pressable onPress={unlocked ? onPress : undefined} disabled={!unlocked}>
      <Animated.View style={[styles.wrap, glowStyle]}>
        <LinearGradient
          colors={unlocked ? ['#3B0A0A', '#7A1414'] : ['#2b2b2b', '#1a1a1a']}
          style={styles.gradient}
        >
          <Text style={styles.emoji}>🥋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{defeated ? 'The Sensei (Defeated)' : 'The Sensei'}</Text>
            <Text style={styles.subtitle}>
              {defeated
                ? 'You hold the Black Belt. Fight again anytime.'
                : unlocked
                  ? 'All special cards. Maxed out. Beatable... barely.'
                  : 'Reach the final Arena to challenge him.'}
            </Text>
          </View>
          {!unlocked && <Text style={styles.lock}>🔒</Text>}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    shadowColor: '#FF3B3B',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 16,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00000040',
  },
  emoji: { fontSize: 32 },
  title: { color: colors.textLight, fontWeight: '900', fontSize: 16 },
  subtitle: { color: '#EDEDED', fontSize: 12, marginTop: 2, opacity: 0.85 },
  lock: { fontSize: 20 },
});
