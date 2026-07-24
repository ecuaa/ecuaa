import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors } from '../theme/colors';

const AD_DURATION_SECONDS = 4;

/**
 * A simulated post-match interstitial ad break. Real store policy requires ads only at natural
 * breaks (never mid-battle) -- this only ever appears after a match has ended. A production
 * build replaces this component's body with the real ad SDK's view.
 */
export function AdBreakOverlay({ onDone }: { onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.adBox}>
        <Text style={styles.adLabel}>Advertisement</Text>
        <Text style={styles.adTitle}>🦆 Duck Jitsu</Text>
        <Text style={styles.adBody}>Enjoying the dojo? Remove ads anytime from your Profile.</Text>
        {secondsLeft > 0 ? (
          <Text style={styles.countdown}>Skip in {secondsLeft}s</Text>
        ) : (
          <PrimaryButton title="Continue" onPress={onDone} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000d0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  adBox: {
    width: '82%',
    backgroundColor: colors.mat,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  adLabel: { color: colors.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  adTitle: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  adBody: { color: colors.textMuted, textAlign: 'center' },
  countdown: { color: colors.textMuted, fontWeight: '700', marginTop: 8 },
});
