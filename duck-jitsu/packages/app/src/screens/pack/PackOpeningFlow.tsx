import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PacksApi } from '../../api/endpoints';
import type { RevealedCard } from '../../api/types';
import { GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBackground } from '../../components/ScreenBackground';
import { playSfx } from '../../sound/soundManager';
import { useAuthStore } from '../../store/authStore';
import { RevealCard } from './RevealCard';
import { RipPackEnvelope } from './RipPackEnvelope';

type Stage = 'loading' | 'closed' | 'opening' | 'revealing' | 'done';

interface Props {
  source: 'starter' | 'basic' | 'premium';
  onDone: () => void;
}

/** The full pack-open sequence: shake/glow -> burst open -> one-at-a-time reveals -> summary. */
export function PackOpeningFlow({ source, onDone }: Props) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const [stage, setStage] = useState<Stage>('loading');
  const [cards, setCards] = useState<RevealedCard[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const call = source === 'starter' ? PacksApi.openStarter() : PacksApi.open(source);
    call
      .then((res) => {
        setCards(res.cards);
        setProfile(res.profile);
        setStage('closed');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not open pack'));
  }, [source]);

  function beginOpening() {
    playSfx('packOpen');
    setStage('opening');
    setTimeout(() => setStage('revealing'), 480);
  }

  function revealNext() {
    if (revealIndex < cards.length - 1) {
      setRevealIndex((i) => i + 1);
    } else {
      setStage('done');
    }
  }

  if (error) {
    return (
      <ScreenBackground>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title="Back" onPress={onDone} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.centered}>
        {(stage === 'loading' || stage === 'closed' || stage === 'opening') && (
          <RipPackEnvelope interactive={stage === 'closed'} onRipped={beginOpening} />
        )}

        {stage === 'closed' && <Text style={styles.tapHint}>Drag the pack apart to rip it open!</Text>}

        {stage === 'revealing' && cards[revealIndex] && (
          <RevealCard key={`${cards[revealIndex].id}-${revealIndex}`} card={cards[revealIndex]} onContinue={revealNext} />
        )}

        {stage === 'done' && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>New Cards!</Text>
            <View style={styles.summaryGrid}>
              {cards.map((c, i) => (
                <GameCard
                  key={`${c.id}-${i}`}
                  card={{
                    instanceId: `${c.id}-${i}`,
                    cardId: c.id,
                    element: c.element,
                    rarity: c.rarity,
                    color: c.color,
                    level: 1,
                    special: c.special,
                  }}
                  size="small"
                />
              ))}
            </View>
            <PrimaryButton title="Continue" onPress={onDone} />
          </View>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 20 },
  tapHint: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  summary: { alignItems: 'center', gap: 18 },
  summaryTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 340 },
});
