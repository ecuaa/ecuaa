import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD_COLORS } from '@duck-jitsu/engine';
import { IapApi, ProfileApi } from '../api/endpoints';
import type { IapProduct } from '../api/types';
import { BeltBadge } from '../components/BeltBadge';
import { DuckAvatar, type AvatarAccessory } from '../components/DuckAvatar';
import { GameCard } from '../components/GameCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

const ACCESSORIES: AvatarAccessory[] = ['none', 'bandana', 'bow', 'headband', 'sunglasses', 'cap'];

export function ProfileScreen() {
  const { profile, setProfile, logout } = useAuthStore();
  const [products, setProducts] = useState<IapProduct[]>([]);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);

  useEffect(() => {
    IapApi.products().then((res) => setProducts(res.products));
  }, []);

  if (!profile) return null;

  async function pickColor(color: string) {
    const res = await ProfileApi.updateAvatar(color, profile!.avatar.accessory);
    setProfile(res.profile);
  }

  async function pickAccessory(accessory: AvatarAccessory) {
    const res = await ProfileApi.updateAvatar(profile!.avatar.color, accessory);
    setProfile(res.profile);
  }

  async function purchase(productId: string) {
    setBusyProduct(productId);
    try {
      const res = await IapApi.purchase(productId);
      setProfile(res.profile);
      Alert.alert('Purchase complete', 'Thanks for supporting Duck Jitsu!');
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyProduct(null);
    }
  }

  return (
    <ScreenBackground mat>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Reveal>
          <View style={styles.avatarPreview}>
            <DuckAvatar
              size={110}
              color={colors.cardColors[profile.avatar.color] ?? colors.cardColors.yellow}
              accessory={profile.avatar.accessory as AvatarAccessory}
            />
            <Text style={styles.name}>{profile.displayName}</Text>
            {profile.isGuest && <Text style={styles.guestBadge}>Guest account</Text>}
            <View style={{ marginTop: 8 }}>
              <BeltBadge belt={profile.belt} />
            </View>
          </View>
        </Reveal>

        <Reveal delay={80}>
          <Section title="Duck color">
            <View style={styles.swatchRow}>
              {CARD_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => pickColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: colors.cardColors[c] },
                    profile.avatar.color === c && styles.swatchActive,
                  ]}
                />
              ))}
            </View>
          </Section>
        </Reveal>

        <Reveal delay={140}>
          <Section title="Accessory">
            <View style={styles.swatchRow}>
              {ACCESSORIES.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => pickAccessory(a)}
                  style={[styles.accessoryChip, profile.avatar.accessory === a && styles.accessoryChipActive]}
                >
                  <Text style={[styles.accessoryText, profile.avatar.accessory === a && { color: '#fff' }]}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        </Reveal>

        <Reveal delay={200}>
          <Section title="Card Art Preview (testing)">
            <Text style={styles.sub}>Current style vs. a new illustrated style -- let us know which you like!</Text>
            <View style={styles.artPreviewRow}>
              <ArtPreviewPair label="Ember Duckling" card={{ instanceId: 'p1', cardId: 'fire-red-t0-0', element: 'fire', rarity: 1, color: 'red', level: 1, special: false }} />
              <ArtPreviewPair label="Golden Mallard" card={{ instanceId: 'p2', cardId: 'special-golden-mallard', element: 'fire', rarity: 10, color: 'yellow', level: 1, special: true }} />
            </View>
          </Section>
        </Reveal>

        <Reveal delay={230}>
          <Section title="Shop & support">
            {!profile.adsRemoved &&
              products
                .filter((p) => p.kind === 'remove_ads')
                .map((p) => (
                  <View key={p.id} style={styles.productRow}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <PrimaryButton title={`$${p.priceUsd.toFixed(2)}`} onPress={() => purchase(p.id)} loading={busyProduct === p.id} />
                  </View>
                ))}
            {profile.adsRemoved && <Text style={styles.sub}>Ads removed -- thank you!</Text>}
            {products
              .filter((p) => p.kind === 'premium_currency')
              .map((p) => (
                <View key={p.id} style={styles.productRow}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <PrimaryButton title={`$${p.priceUsd.toFixed(2)}`} onPress={() => purchase(p.id)} loading={busyProduct === p.id} variant="secondary" />
                </View>
              ))}
          </Section>
        </Reveal>

        <Reveal delay={290}>
          <View style={{ marginTop: 20 }}>
            <PrimaryButton title="Log out" variant="danger" onPress={logout} />
          </View>
        </Reveal>
      </ScrollView>
    </ScreenBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ArtPreviewPair({ label, card }: { label: string; card: Parameters<typeof GameCard>[0]['card'] }) {
  return (
    <View style={styles.artPreviewPair}>
      <Text style={styles.artPreviewLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <GameCard card={card} size="medium" illustrated={false} />
          <Text style={styles.artPreviewCaption}>Current</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <GameCard card={card} size="medium" illustrated={true} />
          <Text style={styles.artPreviewCaption}>New</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  avatarPreview: { alignItems: 'center', marginBottom: 20 },
  name: { fontWeight: '800', fontSize: 18, color: colors.textDark, marginTop: 8 },
  guestBadge: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.matShadow },
  sectionTitle: { fontWeight: '800', color: colors.textDark, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#00000020' },
  swatchActive: { borderColor: colors.textDark, borderWidth: 3 },
  artPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 10 },
  artPreviewPair: { gap: 6 },
  artPreviewLabel: { fontWeight: '700', color: colors.textDark, fontSize: 12 },
  artPreviewCaption: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  accessoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#00000010' },
  accessoryChipActive: { backgroundColor: colors.bamboo },
  accessoryText: { fontWeight: '600', color: colors.textDark, textTransform: 'capitalize' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  productName: { fontWeight: '700', color: colors.textDark, flex: 1, marginRight: 8 },
  sub: { color: colors.textMuted },
});
