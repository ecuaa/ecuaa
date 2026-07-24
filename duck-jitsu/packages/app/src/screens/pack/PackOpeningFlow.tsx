import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PacksApi } from '../../api/endpoints';
import type { RevealedCard } from '../../api/types';
import { CardBack, GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBackground } from '../../components/ScreenBackground';
import { playSfx } from '../../sound/soundManager';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { RevealCard } from './RevealCard';

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
    setTimeout(() => setStage('revealing'), 700);
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
          <PackEnvelope
            shaking={stage === 'closed'}
            bursting={stage === 'opening'}
            onPress={stage === 'closed' ? beginOpening : undefined}
          />
        )}

        {stage === 'closed' && <Text style={styles.tapHint}>Tap the pack to open it!</Text>}

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

function PackEnvelope({ shaking, bursting, onPress }: { shaking: boolean; bursting: boolean; onPress?: () => void }) {
  const wobble = useSharedValue(0);
  const glow = useSharedValue(0.3);
  const burst = useSharedValue(1);

  useEffect(() => {
    if (shaking) {
      wobble.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 220, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 220, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      glow.value = withRepeat(withSequence(withTiming(0.9, { duration: 500 }), withTiming(0.3, { duration: 500 })), -1, true);
    }
  }, [shaking]);

  useEffect(() => {
    if (bursting) {
      burst.value = withSequence(withTiming(1.3, { duration: 250 }), withTiming(0, { duration: 350 }));
    }
  }, [bursting]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }, { scale: burst.value }],
    opacity: bursting ? burst.value : 1,
    shadowColor: colors.gold,
    shadowOpacity: glow.value,
    shadowRadius: 20,
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={style}>
        <CardBack size="large" />
      </Animated.View>
    </Pressable>
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
