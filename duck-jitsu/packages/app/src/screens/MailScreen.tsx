import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MailApi } from '../api/endpoints';
import type { MailMessage } from '../api/types';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export function MailScreen() {
  const navigation = useNavigation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [mail, setMail] = useState<MailMessage[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(() => {
    MailApi.list().then((res) => setMail(res.mail)).catch(() => undefined);
  }, []);

  useFocusEffect(load);

  async function claim(id: string) {
    setClaimingId(id);
    try {
      const res = await MailApi.claim(id);
      setMail(res.mail);
      setProfile(res.profile);
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
          <Text style={styles.title}>Mail</Text>
        </View>
      </Reveal>
      <ScrollView contentContainerStyle={styles.list}>
        {mail.map((message, i) => {
          const hasReward = message.rewardSoft > 0 || message.rewardPremium > 0;
          return (
            <Reveal key={message.id} delay={i * 60}>
              <View style={[styles.card, message.claimed && styles.cardClaimed]}>
                <Text style={styles.messageTitle}>{message.title}</Text>
                <Text style={styles.messageBody}>{message.body}</Text>
                {hasReward && (
                  <View style={styles.footer}>
                    <Text style={styles.reward}>
                      {message.rewardSoft > 0 ? `🪙 ${message.rewardSoft}  ` : ''}
                      {message.rewardPremium > 0 ? `💎 ${message.rewardPremium}` : ''}
                    </Text>
                    <PrimaryButton
                      title={message.claimed ? 'Claimed' : 'Claim'}
                      onPress={() => claim(message.id)}
                      disabled={message.claimed}
                      loading={claimingId === message.id}
                      variant={message.claimed ? 'secondary' : 'primary'}
                    />
                  </View>
                )}
              </View>
            </Reveal>
          );
        })}
        {mail.length === 0 && <Text style={styles.empty}>No mail yet.</Text>}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  backLink: { color: colors.textMuted, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: colors.matShadow, gap: 8 },
  cardClaimed: { opacity: 0.6 },
  messageTitle: { fontWeight: '800', color: colors.textDark, fontSize: 15 },
  messageBody: { color: colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  reward: { fontWeight: '800', color: colors.textDark },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
