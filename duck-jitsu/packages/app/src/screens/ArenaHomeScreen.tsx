import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CatalogApi, DailyRewardApi } from '../api/endpoints';
import type { ArenaMineResponse, ArenaSummary, DailyRewardStatus } from '../api/types';
import { BeltBadge } from '../components/BeltBadge';
import { CurrencyPill } from '../components/CurrencyPill';
import { DojoSceneBackground } from '../components/DojoSceneBackground';
import { DuckAvatar } from '../components/DuckAvatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
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
  const { width, height } = useWindowDimensions();
  const [arenaInfo, setArenaInfo] = useState<ArenaMineResponse | null>(null);
  const [allArenas, setAllArenas] = useState<ArenaSummary[]>([]);
  const [dailyReward, setDailyReward] = useState<DailyRewardStatus | null>(null);
  const [playOpen, setPlayOpen] = useState(false);
  const [dojoOpen, setDojoOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      CatalogApi.arenasMine().then(setArenaInfo).catch(() => undefined);
      CatalogApi.arenas().then((res) => setAllArenas(res.arenas)).catch(() => undefined);
      DailyRewardApi.status().then(setDailyReward).catch(() => undefined);
    }, []),
  );

  if (!profile) return null;

  const xpProgress = profile.xpToNextLevel > 0 ? Math.min(1, profile.xp / profile.xpToNextLevel) : 1;

  return (
    <View style={styles.root}>
      <DojoSceneBackground width={width} height={height} />

      <View style={styles.hud}>
        <Reveal>
          <View style={styles.hudTop}>
            <DuckAvatar
              size={48}
              color={colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow}
              accessory={profile.avatar.accessory as AvatarAccessory}
              idle={false}
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.name}>{profile.displayName}</Text>
              <View style={styles.levelRow}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>{profile.level}</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
                </View>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <CurrencyPill kind="soft" amount={profile.softCurrency} />
              <CurrencyPill kind="premium" amount={profile.premiumCurrency} />
            </View>
          </View>
        </Reveal>

        <Reveal delay={60}>
          <View style={styles.hudIcons}>
            <IconButton emoji="🏆" onPress={() => navigation.navigate('Rankings')} />
            <IconButton emoji="✉️" badge={profile.unclaimedMailCount} onPress={() => navigation.navigate('Mail')} />
            <IconButton emoji="👥" badge={profile.pendingFriendRequestCount} onPress={() => navigation.navigate('Friends')} />
          </View>
        </Reveal>
      </View>

      <View style={styles.stage} pointerEvents="box-none">
        <Reveal delay={120}>
          <DuckHero color={colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow} accessory={profile.avatar.accessory as AvatarAccessory} />
        </Reveal>
      </View>

      {!profile.starterPackClaimed && (
        <Reveal delay={160}>
          <Pressable style={styles.starterCallout} onPress={() => navigation.navigate('PackOpening', { source: 'starter' })}>
            <Text style={styles.starterCalloutText}>🎁 Free Starter Pack -- tap to open!</Text>
          </Pressable>
        </Reveal>
      )}

      <View style={styles.bottomRow} pointerEvents="box-none">
        <Reveal delay={200}>
          <View style={styles.leftStack}>
            <DailyRewardTile status={dailyReward} onClaimed={() => setDailyReward((s) => (s ? { ...s, claimable: false, hoursUntilNextClaim: 24 } : s))} />
            <SideTile emoji="🎡" label="Spin Wheel" sublabel="Daily prize" onPress={() => navigation.navigate('SpinWheel')} />
          </View>
        </Reveal>

        <Reveal delay={240}>
          <View style={styles.rightStack}>
            <BigButton emoji="⚔️" title="PLAY" subtitle="Fight and win!" color={colors.gold} onPress={() => setPlayOpen(true)} glow={profile.senseiUnlocked && !profile.hasDefeatedSensei} />
            <BigButton emoji="⛩️" title="DOJO" subtitle="Train and improve!" color={colors.water} onPress={() => setDojoOpen(true)} />
            <BigButton emoji="📜" title="MISSIONS" subtitle="Complete tasks!" color={colors.gem} onPress={() => navigation.navigate('Missions')} />
            <BigButton emoji="🛍️" title="SHOP" subtitle="Gear up!" color={colors.bamboo} onPress={() => navigation.navigate('MainTabs', { screen: 'Shop' })} />
          </View>
        </Reveal>
      </View>

      <Modal visible={playOpen} transparent animationType="slide" onRequestClose={() => setPlayOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPlayOpen(false)}>
          <Pressable style={styles.playSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Choose a Battle</Text>
            <PrimaryButton title="🥊 Practice vs AI" onPress={() => { setPlayOpen(false); navigation.navigate('Battle', { mode: 'practice' }); }} />
            <View style={{ height: 10 }} />
            <PrimaryButton title="⚔️ Casual Match" variant="secondary" onPress={() => { setPlayOpen(false); navigation.navigate('Battle', { mode: 'casual' }); }} />
            <View style={{ height: 10 }} />
            <PrimaryButton title="🏆 Ranked Match" variant="danger" onPress={() => { setPlayOpen(false); navigation.navigate('Battle', { mode: 'ranked' }); }} />
            {profile.senseiUnlocked && (
              <>
                <View style={{ height: 14 }} />
                <SenseiBanner
                  unlocked={profile.senseiUnlocked}
                  defeated={profile.hasDefeatedSensei}
                  onPress={() => { setPlayOpen(false); navigation.navigate('Battle', { mode: 'sensei' }); }}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={dojoOpen} transparent animationType="slide" onRequestClose={() => setDojoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDojoOpen(false)}>
          <Pressable style={styles.dojoSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>The Dojo</Text>
            <View style={styles.beltRow}>
              <BeltBadge belt={profile.belt} />
            </View>
            {arenaInfo && (
              <View style={styles.arenaCard}>
                <Text style={styles.arenaName}>{arenaInfo.current.name}</Text>
                <Text style={styles.arenaDesc}>{arenaInfo.current.description}</Text>
                {arenaInfo.next ? (
                  <Text style={styles.nextArenaText}>
                    {arenaInfo.next.trophyRequirement - profile.trophies} trophies to {arenaInfo.next.name} · unlocks{' '}
                    {arenaInfo.next.newCardCount} new cards
                  </Text>
                ) : (
                  <Text style={styles.nextArenaText}>You've reached the final Arena!</Text>
                )}
              </View>
            )}
            <Text style={styles.roadHeading}>Trophy Road</Text>
            <TrophyRoad arenas={allArenas} currentTier={profile.arena.tier} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function IconButton({ emoji, badge, onPress }: { emoji: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SideTile({ emoji, label, sublabel, onPress }: { emoji: string; label: string; sublabel: string; onPress: () => void }) {
  return (
    <Pressable style={styles.sideTile} onPress={onPress}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={styles.sideTileLabel}>{label}</Text>
      <Text style={styles.sideTileSub}>{sublabel}</Text>
    </Pressable>
  );
}

function DailyRewardTile({ status, onClaimed }: { status: DailyRewardStatus | null; onClaimed: () => void }) {
  const [claiming, setClaiming] = useState(false);
  const [claimedText, setClaimedText] = useState<string | null>(null);
  const setProfile = useAuthStore((s) => s.setProfile);

  async function claim() {
    if (!status?.claimable || claiming) return;
    setClaiming(true);
    try {
      const res = await DailyRewardApi.claim();
      setProfile(res.profile);
      setClaimedText(`+${res.reward.softCurrency}🪙${res.reward.premiumCurrency ? ` +${res.reward.premiumCurrency}💎` : ''}`);
      onClaimed();
    } catch {
      // ignore -- status will reflect not-claimable on next load
    } finally {
      setClaiming(false);
    }
  }

  const sublabel = claimedText
    ? claimedText
    : status?.claimable
      ? 'Tap to claim!'
      : status
        ? `${Math.ceil(status.hoursUntilNextClaim)}h left`
        : '...';

  return (
    <Pressable style={[styles.sideTile, status?.claimable && styles.sideTileReady]} onPress={claim} disabled={!status?.claimable || claiming}>
      <Text style={{ fontSize: 22 }}>🎁</Text>
      <Text style={styles.sideTileLabel}>Daily Reward</Text>
      <Text style={styles.sideTileSub}>{sublabel}</Text>
    </Pressable>
  );
}

function BigButton({
  emoji,
  title,
  subtitle,
  color,
  onPress,
  glow,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  glow?: boolean;
}) {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    if (!glow) return;
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ shadowOpacity: glow ? pulse.value : 0 }));

  return (
    <Animated.View style={[styles.bigButtonWrap, glowStyle]}>
      <Pressable style={[styles.bigButton, { backgroundColor: color }]} onPress={onPress}>
        <Text style={styles.bigButtonEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bigButtonTitle}>{title}</Text>
          <Text style={styles.bigButtonSubtitle}>{subtitle}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DuckHero({ color, accessory }: { color: string; accessory: AvatarAccessory }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View style={style}>
      <DuckAvatar size={140} color={color} accessory={accessory} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E3A52' },
  hud: { paddingTop: 50, paddingHorizontal: 14, gap: 10 },
  hudTop: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#fff', fontWeight: '900', fontSize: 16 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  levelPill: { backgroundColor: colors.water, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#fff4' },
  levelPillText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  xpTrack: { flex: 1, height: 8, backgroundColor: '#ffffff2a', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  hudIcons: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  starterCallout: {
    position: 'absolute',
    bottom: 245,
    alignSelf: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  starterCalloutText: { fontWeight: '900', color: colors.textDark },
  bottomRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 24, gap: 10, alignItems: 'flex-end' },
  leftStack: { gap: 8, width: 96 },
  sideTile: {
    backgroundColor: '#00000055',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  sideTileReady: { borderColor: colors.gold, backgroundColor: '#7A5C0055' },
  sideTileLabel: { color: '#fff', fontWeight: '800', fontSize: 11, textAlign: 'center', marginTop: 2 },
  sideTileSub: { color: '#ffffffaa', fontSize: 9, textAlign: 'center', marginTop: 1 },
  rightStack: { flex: 1, gap: 8 },
  bigButtonWrap: { borderRadius: 14, shadowColor: colors.gold, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ffffff33',
    borderBottomWidth: 4,
    borderBottomColor: '#00000030',
  },
  bigButtonEmoji: { fontSize: 24 },
  bigButtonTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  bigButtonSubtitle: { color: '#ffffffcc', fontSize: 11, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  playSheet: { backgroundColor: colors.mat, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  dojoSheet: { backgroundColor: colors.mat, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: colors.textDark, marginBottom: 14, textAlign: 'center' },
  beltRow: { alignItems: 'center', marginBottom: 14 },
  arenaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 2, borderColor: colors.matShadow },
  arenaName: { fontSize: 18, fontWeight: '900', color: colors.textDark },
  arenaDesc: { color: colors.textMuted, marginTop: 4 },
  nextArenaText: { marginTop: 8, color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  roadHeading: { fontSize: 16, fontWeight: '900', color: colors.textDark, marginBottom: 8 },
});
