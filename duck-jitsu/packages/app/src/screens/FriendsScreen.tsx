import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FriendsApi } from '../api/endpoints';
import type { FriendEntry, FriendSearchResult } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { colors } from '../theme/colors';

export function FriendsScreen() {
  const navigation = useNavigation();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    FriendsApi.list().then((res) => {
      setFriends(res.friends);
      setIncoming(res.incoming);
      setOutgoing(res.outgoing);
    });
  }, []);

  useFocusEffect(load);

  async function search() {
    if (!query.trim()) return;
    try {
      const res = await FriendsApi.search(query.trim());
      setResults(res.results);
    } catch (err) {
      Alert.alert('Search failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  async function sendRequest(userId: string) {
    setBusyId(userId);
    try {
      await FriendsApi.request(userId);
      setResults((r) => r.filter((u) => u.userId !== userId));
      load();
    } catch (err) {
      Alert.alert('Could not send request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function accept(linkId: string) {
    setBusyId(linkId);
    try {
      await FriendsApi.accept(linkId);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(linkId: string) {
    setBusyId(linkId);
    try {
      await FriendsApi.decline(linkId);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScreenBackground mat>
      <Reveal>
        <View style={styles.header}>
          <Text style={styles.backLink} onPress={() => navigation.goBack()} suppressHighlighting>
            ← Back
          </Text>
          <Text style={styles.title}>Friends</Text>
        </View>
      </Reveal>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search by duck name"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            style={styles.input}
          />
          <PrimaryButton title="Search" onPress={search} />
        </View>

        {results.map((user) => (
          <View key={user.userId} style={styles.row}>
            <Text style={styles.name}>{user.displayName}</Text>
            <PrimaryButton title="Add" onPress={() => sendRequest(user.userId)} loading={busyId === user.userId} variant="secondary" />
          </View>
        ))}

        {incoming.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Requests</Text>
            {incoming.map((entry) => (
              <View key={entry.linkId} style={styles.row}>
                <Text style={styles.name}>{entry.displayName}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PrimaryButton title="Accept" onPress={() => accept(entry.linkId)} loading={busyId === entry.linkId} />
                  <PrimaryButton title="Decline" onPress={() => decline(entry.linkId)} variant="danger" />
                </View>
              </View>
            ))}
          </>
        )}

        {outgoing.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Pending</Text>
            {outgoing.map((entry) => (
              <View key={entry.linkId} style={styles.row}>
                <Text style={styles.name}>{entry.displayName}</Text>
                <Text style={styles.pendingLabel}>Requested</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionHeading}>Friends ({friends.length})</Text>
        {friends.map((entry) => (
          <View key={entry.linkId} style={styles.row}>
            <Text style={styles.name}>{entry.displayName}</Text>
            <Text style={styles.trophies}>🏆 {entry.trophies}</Text>
          </View>
        ))}
        {friends.length === 0 && <Text style={styles.empty}>No friends yet -- search above to add some!</Text>}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  backLink: { color: colors.textMuted, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.textDark },
  sectionHeading: { fontWeight: '900', color: colors.textDark, fontSize: 15, marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.matShadow,
  },
  name: { fontWeight: '700', color: colors.textDark },
  trophies: { fontWeight: '800', color: colors.textDark },
  pendingLabel: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
});
