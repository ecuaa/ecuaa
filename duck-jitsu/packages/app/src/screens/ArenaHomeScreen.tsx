import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CatalogApi } from '../api/endpoints';
import type { ArenaMineResponse, ArenaSummary } from '../api/types';
import { BeltBadge } from '../components/BeltBadge';
import { CurrencyPill } from '../components/CurrencyPill';
import { DuckAvatar } from '../components/DuckAvatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { SenseiBanner } from '../components/SenseiBanner';
import { TrophyRoad } from '../components/TrophyRoad';
import type { AvatarAccessory } from '../components/DuckAvatar';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ArenaHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, refreshProfile } = useAuthStore();
  const [arenaInfo, setArenaInfo] = useState<ArenaMineResponse | null>(null);
  const [allArenas, setAllArenas] = useState<ArenaSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      CatalogApi.arenasMine().then(setArenaInfo).catch(() => undefined);
      CatalogApi.arenas().then((res) => setAllArenas(res.arenas)).catch(() => undefined);
    }, []),
  );

  if (!profile) return null;

  const progressToNext = arenaInfo?.next
    ? Math.min(
        1,
        (profile.trophies - arenaInfo.current.trophyRequirement) /
          Math.max(1, arenaInfo.next.trophyRequirement - arenaInfo.current.trophyRequirement),
      )
    : 1;

  return (
    <ScreenBackground mat>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Reveal>
          <View style={styles.header}>
            <DuckAvatar
              size={64}
              color={colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow}
              accessory={profile.avatar.accessory as AvatarAccessory}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{profile.displayName}</Text>
              <Text style={styles.trophies}>🏆 {profile.trophies} trophies</Text>
              <BeltBadge belt={profile.belt} size="small" />
            </View>
            <View style={{ gap: 6 }}>
              <CurrencyPill kind="soft" amount={profile.softCurrency} />
              <CurrencyPill kind="premium" amount={profile.premiumCurrency} />
            </View>
          </View>
        </Reveal>

        <Reveal delay={80}>
          <View style={styles.arenaCard}>
            <FloatingDiorama />
            <Text style={styles.arenaName}>{arenaInfo?.current.name ?? profile.arena.name}</Text>
            <Text style={styles.arenaDesc}>{arenaInfo?.current.description}</Text>
            {arenaInfo?.next && (
              <>
                <ProgressBar progress={progressToNext} />
                <Text style={styles.nextArenaText}>
                  {arenaInfo.next.trophyRequirement - profile.trophies} trophies to {arenaInfo.next.name} · unlocks{' '}
                  {arenaInfo.next.newCardCount} new cards
                </Text>
              </>
            )}
            {!arenaInfo?.next && <Text style={styles.nextArenaText}>You've reached the final Arena!</Text>}
          </View>
        </Reveal>

        {!profile.starterPackClaimed && (
          <Reveal delay={140}>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>Your Starter Pack is waiting!</Text>
              <PrimaryButton title="Open Starter Pack" onPress={() => navigation.navigate('PackOpening', { source: 'starter' })} />
            </View>
          </Reveal>
        )}

        <Reveal delay={200}>
          <SenseiBanner
            unlocked={profile.senseiUnlocked}
            defeated={profile.hasDefeatedSensei}
            onPress={() => navigation.navigate('Battle', { mode: 'sensei' })}
          />
        </Reveal>

        <Reveal delay={260}>
          <View style={styles.buttons}>
            <PrimaryButton title="🥊 Practice vs AI" onPress={() => navigation.navigate('Battle', { mode: 'practice' })} />
            <View style={{ height: 12 }} />
            <PrimaryButton
              title="⚔️ Casual Match"
              variant="secondary"
              onPress={() => navigation.navigate('Battle', { mode: 'casual' })}
            />
            <View style={{ height: 12 }} />
            <PrimaryButton
              title="🏆 Ranked Match"
              variant="danger"
              onPress={() => navigation.navigate('Battle', { mode: 'ranked' })}
            />
          </View>
        </Reveal>

        <Reveal delay={320}>
          <View style={styles.roadSection}>
            <Text style={styles.roadHeading}>Trophy Road</Text>
            <TrophyRoad arenas={allArenas} currentTier={profile.arena.tier} />
          </View>
        </Reveal>
      </ScrollView>
    </ScreenBackground>
  );
}

function FloatingDiorama() {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View style={[styles.diorama, style]}>
      <Text style={styles.dioramaEmoji}>🏯</Text>
    </Animated.View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(progress, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const style = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  trophies: { color: colors.textMuted, marginTop: 2, marginBottom: 4, fontWeight: '600' },
  arenaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.matShadow,
    alignItems: 'center',
  },
  diorama: { marginBottom: 4 },
  dioramaEmoji: { fontSize: 56 },
  arenaName: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  arenaDesc: { color: colors.textMuted, marginTop: 4, marginBottom: 10, textAlign: 'center' },
  progressTrack: { height: 12, backgroundColor: '#00000012', borderRadius: 8, overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%', backgroundColor: colors.bamboo, borderRadius: 8 },
  nextArenaText: { marginTop: 6, color: colors.textMuted, fontWeight: '600', fontSize: 12, textAlign: 'center' },
  callout: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  calloutText: { fontWeight: '800', fontSize: 16, color: colors.textDark },
  buttons: { marginTop: 8, marginBottom: 8 },
  roadSection: { marginTop: 8 },
  roadHeading: { fontSize: 18, fontWeight: '900', color: colors.textDark, marginBottom: 10 },
});
