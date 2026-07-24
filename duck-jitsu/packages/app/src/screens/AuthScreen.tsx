import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { DuckAvatar } from '../components/DuckAvatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { Reveal } from '../components/Reveal';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const { registerWithEmail, loginWithEmail, continueAsGuest, error } = useAuthStore();

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email.trim(), password, displayName.trim() || 'New Duck');
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch {
      // error surfaced via store
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setBusy(true);
    try {
      await continueAsGuest();
    } catch {
      // ignore, surfaced via store
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Reveal>
          <View style={styles.header}>
            <DuckAvatar size={96} color={colors.cardColors.yellow} accessory="headband" />
            <Text style={styles.title}>Duck Jitsu</Text>
            <Text style={styles.subtitle}>Splash. Scorch. Freeze. Win the dojo.</Text>
          </View>
        </Reveal>

        <Reveal delay={120}>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <ToggleTab label="Sign up" active={mode === 'register'} onPress={() => setMode('register')} />
              <ToggleTab label="Log in" active={mode === 'login'} onPress={() => setMode('login')} />
            </View>

            {mode === 'register' && (
              <TextInput
                placeholder="Duck name"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                autoCapitalize="words"
              />
            )}
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton
              title={mode === 'register' ? 'Create account' : 'Log in'}
              onPress={submit}
              loading={busy}
              disabled={!email || !password}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton title="Continue as guest" onPress={guest} loading={busy} variant="secondary" />
          </View>
        </Reveal>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

function ToggleTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.toggleTab, active && styles.toggleTabActive]}
      suppressHighlighting
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '900', color: colors.textLight, marginTop: 6 },
  subtitle: { color: colors.textLight, opacity: 0.85, marginTop: 4 },
  card: {
    backgroundColor: colors.mat,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: colors.matShadow,
    padding: 18,
  },
  toggleRow: { flexDirection: 'row', marginBottom: 14, backgroundColor: '#00000010', borderRadius: 12 },
  toggleTab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '700',
    color: colors.textMuted,
    overflow: 'hidden',
  },
  toggleTabActive: { backgroundColor: colors.bamboo, color: colors.textLight, borderRadius: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: colors.textDark,
  },
  error: { color: colors.danger, marginBottom: 8, fontWeight: '600' },
});
