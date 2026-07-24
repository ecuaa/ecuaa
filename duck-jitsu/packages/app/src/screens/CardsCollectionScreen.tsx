import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CardDef } from '@duck-jitsu/engine';
import { CatalogApi } from '../api/endpoints';
import { GameCard } from '../components/GameCard';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export function CardsCollectionScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [unlockedCards, setUnlockedCards] = useState<CardDef[]>([]);

  useFocusEffect(
    useCallback(() => {
      CatalogApi.mine().then((res) => setUnlockedCards(res.cards)).catch(() => undefined);
    }, []),
  );

  if (!profile) return null;
  const owned = new Map(profile.ownedCards.map((c) => [c.cardId, c]));
  const ownedCount = unlockedCards.filter((c) => owned.has(c.id)).length;

  return (
    <ScreenBackground mat>
      <Reveal>
        <View style={styles.header}>
          <Text style={styles.title}>Card Collection</Text>
          <Text style={styles.subtitle}>
            {ownedCount} / {unlockedCards.length} unlocked so far
          </Text>
        </View>
      </Reveal>
      <FlatList
        data={unlockedCards}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => {
          const ownedCard = owned.get(item.id);
          return (
            <Reveal delay={Math.min(index, 18) * 30}>
              <View style={styles.cell}>
                <GameCard
                  card={{
                    instanceId: item.id,
                    cardId: item.id,
                    element: item.element,
                    rarity: item.rarity,
                    color: item.color,
                    level: ownedCard?.level ?? 1,
                    special: item.special,
                  }}
                  size="small"
                  dimmed={!ownedCard}
                />
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                {ownedCard ? (
                  <Text style={styles.cardMeta}>Lv {ownedCard.level}</Text>
                ) : (
                  <Text style={styles.cardMetaLocked}>Locked</Text>
                )}
              </View>
            </Reveal>
          );
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.textDark },
  subtitle: { color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  grid: { padding: 12, paddingBottom: 32 },
  row: { justifyContent: 'flex-start', gap: 8 },
  cell: { width: 100, alignItems: 'center', marginBottom: 16 },
  cardName: { fontSize: 11, fontWeight: '700', color: colors.textDark, marginTop: 4, textAlign: 'center' },
  cardMeta: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  cardMetaLocked: { fontSize: 10, color: colors.textMuted, fontWeight: '600', opacity: 0.6 },
});
