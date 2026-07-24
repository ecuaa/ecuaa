import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CARD_COLORS } from '@duck-jitsu/engine';
import { ClansApi } from '../api/endpoints';
import type { ClanDetail, ClanSummary } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export function ClanScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [myClan, setMyClan] = useState<ClanDetail | null>(null);
  const [clans, setClans] = useState<ClanSummary[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    ClansApi.mine().then((res) => setMyClan(res.clan));
    ClansApi.list().then((res) => setClans(res.clans));
  }, []);

  useFocusEffect(load);

  async function create() {
    if (!name.trim()) return;
    setBusyId('create');
    try {
      const color = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
      const res = await ClansApi.create(name.trim(), color);
      setMyClan(res.clan);
      setCreating(false);
      setName('');
    } catch (err) {
      Alert.alert('Could not create clan', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function join(clanId: string) {
    setBusyId(clanId);
    try {
      const res = await ClansApi.join(clanId);
      setMyClan(res.clan);
    } catch (err) {
      Alert.alert('Could not join clan', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function leave() {
    setBusyId('leave');
    try {
      await ClansApi.leave();
      setMyClan(null);
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (!profile) return null;

  if (myClan) {
    return (
      <ScreenBackground mat>
        <ScrollView contentContainerStyle={styles.list}>
          <Reveal>
            <View style={[styles.banner, { backgroundColor: colors.cardColors[myClan.bannerColor] ?? colors.bamboo }]}>
              <Text style={styles.clanName}>{myClan.name}</Text>
              {myClan.description ? <Text style={styles.clanDesc}>{myClan.description}</Text> : null}
              <Text style={styles.memberCount}>{myClan.members.length} members</Text>
            </View>
          </Reveal>
          <Text style={styles.sectionHeading}>Roster</Text>
          {myClan.members.map((member, i) => (
            <Reveal key={member.userId} delay={i * 50}>
              <View style={styles.row}>
                <Text style={styles.name}>
                  {member.displayName} {member.role === 'leader' ? '👑' : ''}
                </Text>
                <Text style={styles.trophies}>🏆 {member.trophies}</Text>
              </View>
            </Reveal>
          ))}
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title="Leave Clan" onPress={leave} loading={busyId === 'leave'} variant="danger" />
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground mat>
      <Reveal>
        <View style={styles.header}>
          <Text style={styles.title}>Clans</Text>
          <Text style={styles.subtitle}>Join a clan to battle alongside other ducks</Text>
        </View>
      </Reveal>
      <ScrollView contentContainerStyle={styles.list}>
        {creating ? (
          <View style={styles.createCard}>
            <TextInput
              placeholder="Clan name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={styles.input}
              maxLength={24}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton title="Create" onPress={create} loading={busyId === 'create'} />
              <PrimaryButton title="Cancel" onPress={() => setCreating(false)} variant="secondary" />
            </View>
          </View>
        ) : (
          <PrimaryButton title="+ Create a Clan" onPress={() => setCreating(true)} />
        )}

        <Text style={styles.sectionHeading}>Browse Clans</Text>
        {clans.map((clan, i) => (
          <Reveal key={clan.id} delay={i * 50}>
            <View style={[styles.row, { borderLeftWidth: 4, borderLeftColor: colors.cardColors[clan.bannerColor] ?? colors.bamboo }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{clan.name}</Text>
                <Text style={styles.memberSub}>{clan.memberCount} members</Text>
              </View>
              <PrimaryButton title="Join" onPress={() => join(clan.id)} loading={busyId === clan.id} variant="secondary" />
            </View>
          </Reveal>
        ))}
        {clans.length === 0 && <Text style={styles.empty}>No clans yet -- be the first to create one!</Text>}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  subtitle: { color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  banner: { borderRadius: 16, padding: 18, gap: 4 },
  clanName: { fontSize: 22, fontWeight: '900', color: '#fff' },
  clanDesc: { color: '#ffffffdd', fontWeight: '600' },
  memberCount: { color: '#ffffffcc', fontWeight: '700', marginTop: 4 },
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
  memberSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  trophies: { fontWeight: '800', color: colors.textDark },
  createCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, borderWidth: 2, borderColor: colors.matShadow },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.textDark },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
});
