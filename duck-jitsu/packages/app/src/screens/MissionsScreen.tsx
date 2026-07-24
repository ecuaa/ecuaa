import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MissionsApi } from '../api/endpoints';
import type { MissionView } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

function rewardText(reward: MissionView['reward']): string {
  const parts: string[] = [];
  if (reward.softCurrency) parts.push(`🪙 ${reward.softCurrency}`);
  if (reward.premiumCurrency) parts.push(`💎 ${reward.premiumCurrency}`);
  if (reward.xp) parts.push(`⭐ ${reward.xp} XP`);
  return parts.join('  ·  ');
}

export function MissionsScreen() {
  const navigation = useNavigation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [missions, setMissions] = useState<MissionView[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(() => {
    MissionsApi.today().then((res) => setMissions(res.missions)).catch(() => undefined);
  }, []);

  useFocusEffect(load);

  async function claim(missionId: string) {
    setClaimingId(missionId);
    try {
      const res = await MissionsApi.claim(missionId);
      setMissions(res.missions);
      setProfile(res.profile);
    } catch {
      // surfaced implicitly by the button staying claimable
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <ScreenBackground mat>
      <Reveal>
        <View style={styles.header}>
          <Text style={styles.backLink} onPress={() => navigation.goBack()} suppressHighlighting>
            ← Back
          </Text>
          <Text style={styles.title}>Daily Missions</Text>
          <Text style={styles.subtitle}>Resets every day -- come back tomorrow for a new set!</Text>
        </View>
      </Reveal>
      <ScrollView contentContainerStyle={styles.list}>
        {missions.map((mission, i) => {
          const complete = mission.progress >= mission.target;
          return (
            <Reveal key={mission.id} delay={i * 80}>
              <View style={styles.card}>
                <Text style={styles.description}>{mission.description}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` },
                      mission.claimed && styles.progressFillClaimed,
                    ]}
                  />
                </View>
                <View style={styles.footer}>
                  <Text style={styles.progressText}>
                    {Math.min(mission.progress, mission.target)} / {mission.target}
                  </Text>
                  <Text style={styles.reward}>{rewardText(mission.reward)}</Text>
                </View>
                <PrimaryButton
                  title={mission.claimed ? 'Claimed' : complete ? 'Claim Reward' : 'In Progress'}
                  onPress={() => claim(mission.id)}
                  disabled={!complete || mission.claimed}
                  loading={claimingId === mission.id}
                  variant={mission.claimed ? 'secondary' : 'primary'}
                />
              </View>
            </Reveal>
          );
        })}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  backLink: { color: colors.textMuted, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  subtitle: { color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  list: { padding: 16, gap: 14, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: colors.matShadow, gap: 10 },
  description: { fontWeight: '800', color: colors.textDark, fontSize: 16 },
  progressTrack: { height: 10, backgroundColor: '#00000012', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.bamboo, borderRadius: 6 },
  progressFillClaimed: { backgroundColor: colors.gold },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { color: colors.textMuted, fontWeight: '700' },
  reward: { color: colors.textDark, fontWeight: '700' },
});
