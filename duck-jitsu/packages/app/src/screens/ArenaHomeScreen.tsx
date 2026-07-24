import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CatalogApi } from '../api/endpoints';
import type { ArenaMineResponse } from '../api/types';
import { CurrencyPill } from '../components/CurrencyPill';
import { DuckAvatar } from '../components/DuckAvatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenBackground } from '../components/ScreenBackground';
import type { AvatarAccessory } from '../components/DuckAvatar';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ArenaHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, refreshProfile } = useAuthStore();
  const [arenaInfo, setArenaInfo] = useState<ArenaMineResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      CatalogApi.arenasMine().then(setArenaInfo).catch(() => undefined);
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
        <View style={styles.header}>
          <DuckAvatar
            size={72}
            color={colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow}
            accessory={profile.avatar.accessory as AvatarAccessory}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.trophies}>🏆 {profile.trophies} trophies</Text>
          </View>
          <View style={{ gap: 6 }}>
            <CurrencyPill kind="soft" amount={profile.softCurrency} />
            <CurrencyPill kind="premium" amount={profile.premiumCurrency} />
          </View>
        </View>

        <View style={styles.arenaCard}>
          <Text style={styles.arenaName}>{arenaInfo?.current.name ?? profile.arena.name}</Text>
          <Text style={styles.arenaDesc}>{arenaInfo?.current.description}</Text>
          {arenaInfo?.next && (
            <>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressToNext * 100}%` }]} />
              </View>
              <Text style={styles.nextArenaText}>
                {arenaInfo.next.trophyRequirement - profile.trophies} trophies to {arenaInfo.next.name} · unlocks{' '}
                {arenaInfo.next.newCardCount} new cards
              </Text>
            </>
          )}
        </View>

        {!profile.starterPackClaimed && (
          <View style={styles.callout}>
            <Text style={styles.calloutText}>Your Starter Pack is waiting!</Text>
            <PrimaryButton title="Open Starter Pack" onPress={() => navigation.navigate('PackOpening', { source: 'starter' })} />
          </View>
        )}

        <View style={styles.buttons}>
          <PrimaryButton title="Practice vs AI" onPress={() => navigation.navigate('Battle', { mode: 'practice' })} />
          <View style={{ height: 12 }} />
          <PrimaryButton
            title="Casual Match"
            variant="secondary"
            onPress={() => navigation.navigate('Battle', { mode: 'casual' })}
          />
          <View style={{ height: 12 }} />
          <PrimaryButton
            title="Ranked Match"
            variant="danger"
            onPress={() => navigation.navigate('Battle', { mode: 'ranked' })}
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  trophies: { color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  arenaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.matShadow,
  },
  arenaName: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  arenaDesc: { color: colors.textMuted, marginTop: 4, marginBottom: 10 },
  progressTrack: { height: 12, backgroundColor: '#00000012', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.bamboo },
  nextArenaText: { marginTop: 6, color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  callout: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  calloutText: { fontWeight: '800', fontSize: 16, color: colors.textDark },
  buttons: { marginTop: 8 },
});
