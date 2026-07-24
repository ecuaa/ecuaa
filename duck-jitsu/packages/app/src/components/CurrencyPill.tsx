import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function CurrencyPill({ kind, amount }: { kind: 'soft' | 'premium'; amount: number }) {
  const isSoft = kind === 'soft';
  return (
    <View style={[styles.pill, { backgroundColor: isSoft ? colors.gold : colors.gem }]}>
      <View style={[styles.dot, { backgroundColor: isSoft ? '#B8860B' : '#5B21B6' }]} />
      <Text style={styles.text}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  text: { fontWeight: '800', color: '#1F2933' },
});
