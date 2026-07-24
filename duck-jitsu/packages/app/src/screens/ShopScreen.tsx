import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PackDef } from '@duck-jitsu/engine';
import { PacksApi, ShopApi } from '../api/endpoints';
import type { ShopOffer } from '../api/types';
import { CardBack } from '../components/GameCard';
import { CurrencyPill } from '../components/CurrencyPill';
import { ElementIcon } from '../components/ElementIcon';
import { GameCard } from '../components/GameCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { getCardDef } from '@duck-jitsu/engine';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ShopScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, refreshProfile } = useAuthStore();
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [packs, setPacks] = useState<PackDef[]>([]);
  const [refreshHours, setRefreshHours] = useState(24);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const load = useCallback(() => {
    ShopApi.offers().then((res) => {
      setOffers(res.offers);
      setRefreshHours(res.refreshesInHours);
    });
  }, []);

  useEffect(() => {
    PacksApi.list().then((res) => setPacks(Object.values(res.packs).filter((p) => p.id !== 'starter')));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshProfile();
    }, [load]),
  );

  async function buy(offer: ShopOffer) {
    setBusyOfferId(offer.id);
    try {
      await ShopApi.purchase(offer.id);
      await refreshProfile();
      load();
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyOfferId(null);
    }
  }

  return (
    <ScreenBackground mat>
      <Reveal>
        <View style={styles.header}>
          <Text style={styles.title}>Dojo Shop</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {profile && <CurrencyPill kind="soft" amount={profile.softCurrency} />}
            {profile && <CurrencyPill kind="premium" amount={profile.premiumCurrency} />}
          </View>
        </View>
        <Text style={styles.refreshNote}>Card offers refresh every {refreshHours}h</Text>
      </Reveal>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionHeading}>Card Packs</Text>
        {packs.map((pack, i) => (
          <Reveal key={pack.id} delay={i * 60}>
            <PackOfferCard
              pack={pack}
              canAfford={
                profile
                  ? pack.currency === 'soft'
                    ? profile.softCurrency >= pack.cost
                    : profile.premiumCurrency >= pack.cost
                  : false
              }
              onBuy={() => navigation.navigate('PackOpening', { source: pack.id as 'basic' | 'premium' })}
            />
          </Reveal>
        ))}

        <Text style={styles.sectionHeading}>Today's Cards</Text>
        {offers.map((offer, i) => (
          <Reveal key={offer.id} delay={packs.length * 60 + i * 60}>
            <OfferCard offer={offer} busy={busyOfferId === offer.id} onBuy={() => buy(offer)} />
          </Reveal>
        ))}
        {offers.length === 0 && <Text style={styles.empty}>No offers right now -- check back later!</Text>}
      </ScrollView>
    </ScreenBackground>
  );
}

const ODDS_ORDER: (keyof PackDef['odds'])[] = ['common', 'rare', 'epic', 'legendary', 'special'];

function PackOfferCard({ pack, canAfford, onBuy }: { pack: PackDef; canAfford: boolean; onBuy: () => void }) {
  const oddsText = ODDS_ORDER.filter((band) => pack.odds[band] > 0)
    .map((band) => `${pack.odds[band]}% ${band}`)
    .join(' · ');

  return (
    <View style={styles.offer}>
      <CardBack size="small" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.offerTitle}>{pack.name}</Text>
        <Text style={styles.offerSub}>{pack.cardCount} cards -- odds: {oddsText}</Text>
      </View>
      <PrimaryButton
        title={`${pack.currency === 'soft' ? '🪙' : '💎'} ${pack.cost}`}
        onPress={onBuy}
        disabled={!canAfford}
      />
    </View>
  );
}

function OfferCard({ offer, busy, onBuy }: { offer: ShopOffer; busy: boolean; onBuy: () => void }) {
  if (offer.kind === 'currency_bundle') {
    return (
      <View style={styles.offer}>
        <View style={styles.currencyIcon}>
          <Text style={{ fontSize: 28 }}>{offer.currency === 'soft' ? '🪙' : '💎'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.offerTitle}>{offer.quantity} {offer.currency === 'soft' ? 'Gold' : 'Gems'}</Text>
          <Text style={styles.offerSub}>Real-money bundle</Text>
        </View>
        <PrimaryButton title={`$${offer.realMoneyPriceUsd?.toFixed(2)}`} onPress={onBuy} loading={busy} variant="secondary" />
      </View>
    );
  }

  const cardDef = offer.cardId ? safeGetCardDef(offer.cardId) : null;

  return (
    <View style={styles.offer}>
      {cardDef ? (
        <GameCard
          card={{ instanceId: cardDef.id, cardId: cardDef.id, element: cardDef.element, rarity: cardDef.rarity, color: cardDef.color, level: 1, special: cardDef.special }}
          size="small"
        />
      ) : (
        <View style={styles.currencyIcon}>
          <ElementIcon element="fire" size={26} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.offerTitle}>{cardDef?.name ?? 'Card'}</Text>
        <Text style={styles.offerSub}>
          {offer.kind === 'duplicate_bundle' ? `${offer.quantity} duplicates` : 'New card'}
        </Text>
      </View>
      <PrimaryButton title={`${offer.currency === 'soft' ? '🪙' : '💎'} ${offer.price}`} onPress={onBuy} loading={busy} />
    </View>
  );
}

function safeGetCardDef(id: string) {
  try {
    return getCardDef(id);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  refreshNote: { paddingHorizontal: 16, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  sectionHeading: { fontWeight: '900', color: colors.textDark, fontSize: 15, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.matShadow,
  },
  currencyIcon: { width: 54, height: 76, alignItems: 'center', justifyContent: 'center' },
  offerTitle: { fontWeight: '800', color: colors.textDark },
  offerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
