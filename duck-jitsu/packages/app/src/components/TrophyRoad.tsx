import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ARENA_BELTS } from '@duck-jitsu/engine';
import type { ArenaSummary } from '../api/types';
import { BELT_COLORS } from '../theme/colors';
import { colors } from '../theme/colors';

interface Props {
  arenas: ArenaSummary[];
  currentTier: number;
}

export function TrophyRoad({ arenas, currentTier }: Props) {
  return (
    <View style={styles.wrap}>
      {arenas.map((arena, i) => (
        <View key={arena.id} style={styles.row}>
          <View style={styles.nodeColumn}>
            <ArenaNode tier={arena.tier} currentTier={currentTier} />
            {i < arenas.length - 1 && (
              <View style={[styles.connector, arena.tier < currentTier && styles.connectorDone]} />
            )}
          </View>
          <View style={styles.info}>
            <Text style={[styles.arenaName, arena.tier > currentTier && styles.locked]}>{arena.name}</Text>
            <Text style={[styles.arenaTrophyReq, arena.tier > currentTier && styles.locked]}>
              🏆 {arena.trophyRequirement}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ArenaNode({ tier, currentTier }: { tier: number; currentTier: number }) {
  const belt = ARENA_BELTS[Math.min(tier, ARENA_BELTS.length - 1)];
  const palette = BELT_COLORS[belt];
  const isCurrent = tier === currentTier;
  const isDone = tier < currentTier;
  const isLocked = tier > currentTier;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!isCurrent) return;
    pulse.value = withRepeat(withSequence(withTiming(1.18, { duration: 650 }), withTiming(1, { duration: 650 })), -1, true);
  }, [isCurrent]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: isCurrent ? pulse.value : 1 }] }));

  return (
    <Animated.View
      style={[
        styles.node,
        { backgroundColor: isLocked ? '#00000022' : palette.base, borderColor: isLocked ? '#00000033' : palette.trim },
        isCurrent && styles.nodeCurrent,
        pulseStyle,
      ]}
    >
      <Text style={styles.nodeGlyph}>{isDone ? '✓' : isLocked ? '🔒' : '🥋'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  row: { flexDirection: 'row' },
  nodeColumn: { alignItems: 'center', width: 52 },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: {
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeGlyph: { fontSize: 16 },
  connector: { width: 3, flex: 1, minHeight: 22, backgroundColor: '#00000022', marginVertical: 2 },
  connectorDone: { backgroundColor: colors.bamboo },
  info: { flex: 1, justifyContent: 'center', paddingBottom: 18, paddingLeft: 4 },
  arenaName: { fontWeight: '800', color: colors.textDark, fontSize: 15 },
  arenaTrophyReq: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  locked: { opacity: 0.45 },
});
