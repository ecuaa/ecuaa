import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LeaderboardApi, MatchHistoryApi } from '../api/endpoints';
import type { LeaderboardEntry, MatchHistoryEntry } from '../api/types';
import { DuckAvatar } from '../components/DuckAvatar';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { AvatarAccessory } from '../components/DuckAvatar';

export function RankingsScreen() {
  const [tab, setTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const profile = useAuthStore((s) => s.profile);

  useFocusEffect(
    useCallback(() => {
      LeaderboardApi.top().then((res) => setLeaderboard(res.leaderboard));
      MatchHistoryApi.recent().then((res) => setHistory(res.history));
    }, []),
  );

  return (
    <ScreenBackground mat>
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('leaderboard')} style={[styles.tab, tab === 'leaderboard' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'leaderboard' && styles.tabTextActive]}>Leaderboard</Text>
        </Pressable>
        <Pressable onPress={() => setTab('history')} style={[styles.tab, tab === 'history' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Match History</Text>
        </Pressable>
      </View>

      {tab === 'leaderboard' ? (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => `${item.rank}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, item.displayName === profile?.displayName && styles.rowMe]}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <DuckAvatar
                size={40}
                color={colors.cardColors[item.avatar.color] ?? colors.cardColors.yellow}
                accessory={item.avatar.accessory as AvatarAccessory}
                idle={false}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.sub}>{item.arena}</Text>
              </View>
              <Text style={styles.trophies}>🏆 {item.trophies}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No ranked players yet.</Text>}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.resultDot, { backgroundColor: resultColor(item.result) }]} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>vs {item.opponentName}</Text>
                <Text style={styles.sub}>{item.mode} · {item.result}</Text>
              </View>
              {item.trophyDelta !== 0 && (
                <Text style={[styles.trophyDelta, { color: item.trophyDelta > 0 ? colors.success : colors.danger }]}>
                  {item.trophyDelta > 0 ? '+' : ''}
                  {item.trophyDelta}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Play a match to see your history here.</Text>}
        />
      )}
    </ScreenBackground>
  );
}

function resultColor(result: string) {
  if (result === 'win') return colors.success;
  if (result === 'loss') return colors.danger;
  return colors.textMuted;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#00000012', borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: colors.bamboo },
  tabText: { fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.matShadow,
  },
  rowMe: { borderColor: colors.bamboo, borderWidth: 2 },
  rank: { width: 32, fontWeight: '800', color: colors.textMuted },
  name: { fontWeight: '800', color: colors.textDark },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  trophies: { fontWeight: '800', color: colors.textDark },
  trophyDelta: { fontWeight: '800' },
  resultDot: { width: 14, height: 14, borderRadius: 7 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
