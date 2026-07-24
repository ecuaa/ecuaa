import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { CatalogApi, ProfileApi } from '../../api/endpoints';
import { DuckAvatar, type AvatarAccessory } from '../../components/DuckAvatar';
import { ElementIcon } from '../../components/ElementIcon';
import { GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBackground } from '../../components/ScreenBackground';
import { PackOpeningFlow } from '../pack/PackOpeningFlow';
import { WinEffectOverlay } from '../../animations/WinEffectOverlay';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { useBattleEngine } from '../battle/useBattleEngine';

type Step = 'welcome' | 'elements' | 'battle' | 'won' | 'pack' | 'arena';

export function TutorialFlowScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const setProfile = useAuthStore((s) => s.setProfile);

  async function finish() {
    const res = await ProfileApi.completeTutorial();
    setProfile(res.profile);
  }

  return (
    <ScreenBackground mat={step === 'battle'}>
      {step === 'welcome' && <WelcomeStep onNext={() => setStep('elements')} />}
      {step === 'elements' && <ElementsStep onNext={() => setStep('battle')} />}
      {step === 'battle' && <BattleStep onWon={() => setStep('won')} />}
      {step === 'won' && <WonStep onNext={() => setStep('pack')} />}
      {step === 'pack' && <PackOpeningFlow source="starter" onDone={() => setStep('arena')} />}
      {step === 'arena' && <ArenaStep onNext={finish} />}
    </ScreenBackground>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.centered}>
      <DuckAvatar size={120} color={colors.cardColors.yellow} accessory="headband" />
      <Text style={styles.h1}>Welcome to Duck Jitsu!</Text>
      <Text style={styles.body}>
        Two ducks, one dojo mat. Each turn you both reveal a card at the same time. Let's learn the
        moves.
      </Text>
      <PrimaryButton title="Let's go!" onPress={onNext} />
    </View>
  );
}

function ElementsStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.h1}>The Elemental Cycle</Text>
      <View style={styles.cycleRow}>
        <ElementBadge element="water" label="Water" />
        <Text style={styles.beats}>beats</Text>
        <ElementBadge element="fire" label="Fire" />
      </View>
      <View style={styles.cycleRow}>
        <ElementBadge element="fire" label="Fire" />
        <Text style={styles.beats}>beats</Text>
        <ElementBadge element="ice" label="Ice" />
      </View>
      <View style={styles.cycleRow}>
        <ElementBadge element="ice" label="Ice" />
        <Text style={styles.beats}>beats</Text>
        <ElementBadge element="water" label="Water" />
      </View>
      <Text style={styles.body}>
        Collect three cards of one element in different colors -- or one of each element in
        different colors -- to win the match instantly!
      </Text>
      <PrimaryButton title="Try it in a practice match" onPress={onNext} />
    </View>
  );
}

function ElementBadge({ element, label }: { element: 'fire' | 'water' | 'ice'; label: string }) {
  return (
    <View style={styles.elementBadge}>
      <ElementIcon element={element} size={28} />
      <Text style={styles.elementLabel}>{label}</Text>
    </View>
  );
}

function BattleStep({ onWon }: { onWon: () => void }) {
  const engine = useBattleEngine('tutorial');
  const profile = useAuthStore((s) => s.profile);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (engine.lastTurn && engine.lastTurn.outcome !== 'draw') {
      setShowEffect(true);
    }
  }, [engine.lastTurn]);

  useEffect(() => {
    if (engine.phase === 'finished') {
      const t = setTimeout(onWon, 900);
      return () => clearTimeout(t);
    }
  }, [engine.phase]);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.battleWrap}>
      <View style={styles.tutorialOpponentRow}>
        <DuckAvatar size={48} color={engine.opponentAvatar.color} accessory="none" />
        <Text style={styles.tutorialOpponentName}>{engine.opponentName ?? 'Coach Quackers'}</Text>
      </View>

      <Text style={styles.coachText}>
        {engine.waitingForOpponent
          ? 'Nice pick! Watch what happens...'
          : 'Tap the glowing card to play it!'}
      </Text>

      <View style={styles.tutorialMat}>
        {engine.lastTurn ? (
          <View style={styles.playedRow}>
            <GameCard card={engine.lastTurn.yourCard} size="medium" />
            <Text style={styles.vs}>VS</Text>
            <GameCard card={engine.lastTurn.opponentCard} size="medium" />
          </View>
        ) : (
          <ElementIcon element="fire" size={40} color={colors.matShadow} />
        )}
      </View>

      <ScrollView horizontal contentContainerStyle={styles.hand} showsHorizontalScrollIndicator={false}>
        {engine.view?.you.hand.map((card) => {
          const isHighlighted = card.instanceId === engine.highlightInstanceId;
          return (
            <Pressable
              key={card.instanceId}
              disabled={!isHighlighted || engine.waitingForOpponent}
              onPress={() => engine.playCard(card.instanceId)}
              style={{ marginRight: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isHighlighted ? 'Play highlighted card' : 'Locked card'}
            >
              <Animated.View style={isHighlighted ? pulseStyle : undefined}>
                <GameCard card={card} dimmed={!isHighlighted} selected={isHighlighted} />
              </Animated.View>
            </Pressable>
          );
        })}
      </ScrollView>
      <DuckAvatar
        size={44}
        color={profile ? colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow : colors.cardColors.yellow}
        accessory={(profile?.avatar.accessory as AvatarAccessory) ?? 'none'}
      />

      {showEffect && engine.lastTurn && engine.lastTurn.outcome !== 'draw' && (
        <WinEffectOverlay
          element={(engine.lastTurn.outcome === 'you' ? engine.lastTurn.yourCard : engine.lastTurn.opponentCard).element}
          onDone={() => setShowEffect(false)}
        />
      )}
    </View>
  );
}

function WonStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.h1}>You won! 🎉</Text>
      <Text style={styles.body}>
        You collected one card of each element in different colors -- an instant win! Now let's
        crack open your Starter Pack.
      </Text>
      <PrimaryButton title="Open Starter Pack" onPress={onNext} />
    </View>
  );
}

function ArenaStep({ onNext }: { onNext: () => void }) {
  const [arenaName, setArenaName] = useState('Pond Yard');
  useEffect(() => {
    CatalogApi.arenasMine().then((res) => setArenaName(res.current.name));
  }, []);

  return (
    <View style={styles.centered}>
      <Text style={styles.h1}>Welcome to {arenaName}</Text>
      <Text style={styles.body}>
        Win matches to earn trophies and climb through Arenas. Each new Arena unlocks fresh cards
        and higher levels for the ones you already have. The shop restocks every day with cards
        you've unlocked but don't own yet.
      </Text>
      <PrimaryButton title="Enter the dojo" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  h1: { fontSize: 26, fontWeight: '900', color: colors.textLight, textAlign: 'center' },
  body: { color: colors.textLight, textAlign: 'center', opacity: 0.9, lineHeight: 20 },
  cycleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  beats: { color: colors.textLight, fontWeight: '700' },
  elementBadge: { alignItems: 'center', backgroundColor: '#ffffff22', borderRadius: 12, padding: 10, width: 84 },
  elementLabel: { color: colors.textLight, fontWeight: '700', marginTop: 4 },
  battleWrap: { flex: 1, padding: 16, justifyContent: 'space-between' },
  tutorialOpponentRow: { alignItems: 'center' },
  tutorialOpponentName: { fontWeight: '800', color: colors.textDark, marginTop: 4 },
  coachText: { textAlign: 'center', fontWeight: '800', color: colors.textDark, fontSize: 16, marginBottom: 8 },
  tutorialMat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vs: { fontWeight: '900', color: colors.textMuted },
  hand: { paddingVertical: 10, alignItems: 'flex-end' },
});
