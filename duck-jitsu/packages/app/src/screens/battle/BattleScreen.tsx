import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SpecialCardEffectOverlay } from '../../animations/SpecialCardEffectOverlay';
import { WinEffectOverlay } from '../../animations/WinEffectOverlay';
import { AdBreakOverlay } from '../../components/AdBreakOverlay';
import { CardBack, GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBackground } from '../../components/ScreenBackground';
import type { RootStackParamList } from '../../navigation/types';
import { shouldShowAds } from '../../ads/adManager';
import { playSfx } from '../../sound/soundManager';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { specialAnimationFor, useBattleEngine } from './useBattleEngine';
import { getCardDef } from '@duck-jitsu/engine';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type BattleRoute = RouteProp<RootStackParamList, 'Battle'>;

export function BattleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<BattleRoute>();
  const engine = useBattleEngine(route.params.mode);
  const adsRemoved = useAuthStore((s) => s.profile?.adsRemoved ?? false);
  const [effect, setEffect] = useState<{ kind: 'element'; element: 'fire' | 'water' | 'ice' } | { kind: 'special'; anim: string; name: string } | null>(null);
  const [showAdBreak, setShowAdBreak] = useState(false);
  const lastTurnKeyRef = useRef<string | null>(null);

  function handleContinue() {
    if (shouldShowAds(adsRemoved)) {
      setShowAdBreak(true);
    } else {
      navigation.goBack();
    }
  }

  useEffect(() => {
    if (!engine.lastTurn) return;
    const key = `${engine.view?.turnNumber}-${engine.lastTurn.reason}`;
    if (lastTurnKeyRef.current === key) return;
    lastTurnKeyRef.current = key;

    if (engine.lastTurn.outcome === 'draw') return;
    playSfx('turnWin');
    const specialAnim = specialAnimationFor(engine.lastTurn);
    if (specialAnim) {
      const winningCard = engine.lastTurn.outcome === 'you' ? engine.lastTurn.yourCard : engine.lastTurn.opponentCard;
      let name = 'Special Card';
      try {
        name = getCardDef(winningCard.cardId).name;
      } catch {
        // fall back to generic caption
      }
      setEffect({ kind: 'special', anim: specialAnim, name });
    } else {
      const winningCard = engine.lastTurn.outcome === 'you' ? engine.lastTurn.yourCard : engine.lastTurn.opponentCard;
      setEffect({ kind: 'element', element: winningCard.element });
    }
  }, [engine.lastTurn, engine.view?.turnNumber]);

  useEffect(() => {
    if (engine.phase === 'finished') {
      playSfx(engine.outcome?.winner === 'you' ? 'matchWin' : 'turnWin');
    }
  }, [engine.phase]);

  function handleCardPress(instanceId: string) {
    if (engine.waitingForOpponent || engine.phase !== 'battle') return;
    playSfx('cardFlip');
    engine.playCard(instanceId);
  }

  if (engine.phase === 'queuing') {
    return (
      <ScreenBackground>
        <View style={styles.centered}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.queuingText}>
            Finding a {route.params.mode === 'ranked' ? 'ranked' : 'casual'} opponent…
          </Text>
          <PrimaryButton
            title="Cancel"
            variant="secondary"
            onPress={() => {
              engine.cancelQueue();
              navigation.goBack();
            }}
          />
        </View>
      </ScreenBackground>
    );
  }

  const view = engine.view;

  return (
    <ScreenBackground mat>
      <View style={styles.container}>
        <View style={styles.opponentRow}>
          <Text style={styles.opponentName}>{engine.opponentName ?? 'Opponent'}</Text>
          <View style={styles.handRow}>
            {Array.from({ length: view?.opponent.handCount ?? 0 }).map((_, i) => (
              <View key={i} style={{ marginLeft: i === 0 ? 0 : -30 }}>
                <CardBack size="small" />
              </View>
            ))}
          </View>
          <Text style={styles.pileLabel}>Collected: {view?.opponent.collected.length ?? 0}</Text>
        </View>

        <View style={styles.matCenter}>
          {engine.lastTurn ? (
            <View style={styles.playedRow}>
              <GameCard card={engine.lastTurn.yourCard} size="large" />
              <Text style={styles.vs}>VS</Text>
              <GameCard card={engine.lastTurn.opponentCard} size="large" />
            </View>
          ) : (
            <Text style={styles.hint}>Pick a card to battle!</Text>
          )}
          {engine.waitingForOpponent && <Text style={styles.waiting}>Waiting for opponent…</Text>}
        </View>

        <View style={styles.handArea}>
          <Text style={styles.pileLabel}>Your collected: {view?.you.collected.length ?? 0}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
            {view?.you.hand.map((card) => (
              <Pressable key={card.instanceId} style={{ marginRight: 8 }} onPress={() => handleCardPress(card.instanceId)}>
                <GameCard card={card} dimmed={engine.waitingForOpponent} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {effect?.kind === 'element' && <WinEffectOverlay element={effect.element} onDone={() => setEffect(null)} />}
      {effect?.kind === 'special' && (
        <SpecialCardEffectOverlay specialAnimation={effect.anim} cardName={effect.name} onDone={() => setEffect(null)} />
      )}

      {engine.phase === 'finished' && !showAdBreak && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {engine.outcome?.winner === 'you' ? 'Victory!' : engine.outcome?.winner === 'draw' ? "It's a draw" : 'Defeat'}
            </Text>
            <Text style={styles.resultReason}>{describeReason(engine.outcome?.winReason)}</Text>
            {!!engine.outcome?.trophyDelta && (
              <Text style={[styles.trophyDelta, { color: engine.outcome.trophyDelta > 0 ? colors.success : colors.danger }]}>
                {engine.outcome.trophyDelta > 0 ? '+' : ''}
                {engine.outcome.trophyDelta} trophies
              </Text>
            )}
            {!!engine.outcome?.softCurrencyDelta && (
              <Text style={styles.goldEarned}>🪙 +{engine.outcome.softCurrencyDelta} gold</Text>
            )}
            <PrimaryButton title="Continue" onPress={handleContinue} />
          </View>
        </View>
      )}

      {showAdBreak && <AdBreakOverlay onDone={() => navigation.goBack()} />}
    </ScreenBackground>
  );
}

function describeReason(reason?: string): string {
  switch (reason) {
    case 'set-complete':
      return 'Completed a winning set!';
    case 'tiebreak-pile-size':
      return 'Won on total cards collected.';
    case 'tiebreak-draw':
      return 'Piles were tied.';
    case 'forfeit':
      return 'Opponent disconnected.';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  queuingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  container: { flex: 1, padding: 12, justifyContent: 'space-between' },
  opponentRow: { alignItems: 'center' },
  opponentName: { fontWeight: '800', fontSize: 16, color: colors.textDark },
  handRow: { flexDirection: 'row', marginTop: 6 },
  pileLabel: { color: colors.textMuted, fontWeight: '600', fontSize: 12, marginTop: 4 },
  matCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vs: { fontWeight: '900', color: colors.textMuted },
  hint: { color: colors.textMuted, fontWeight: '600' },
  waiting: { marginTop: 12, color: colors.textMuted, fontWeight: '600' },
  handArea: { alignItems: 'center' },
  hand: { paddingVertical: 8, alignItems: 'flex-end' },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  resultCard: {
    backgroundColor: colors.mat,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    width: '80%',
  },
  resultTitle: { fontSize: 28, fontWeight: '900', color: colors.textDark },
  resultReason: { color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  trophyDelta: { fontWeight: '800', fontSize: 16 },
  goldEarned: { fontWeight: '800', fontSize: 16, color: colors.gold },
});
