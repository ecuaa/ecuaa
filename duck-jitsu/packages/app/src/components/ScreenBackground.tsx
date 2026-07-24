import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

/** The dojo-mat backdrop shared by most screens: a woven mat over a deep pond gradient. */
export function ScreenBackground({ children, mat = false }: { children: ReactNode; mat?: boolean }) {
  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.fill}>
      {mat ? <View style={styles.matPanel}>{children}</View> : children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  matPanel: {
    flex: 1,
    margin: 14,
    borderRadius: 24,
    backgroundColor: colors.mat,
    borderWidth: 6,
    borderColor: colors.matShadow,
    overflow: 'hidden',
  },
});
