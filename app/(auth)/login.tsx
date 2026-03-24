import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Theme } from '@/constants/theme';
import { VintageText, VintageInput, VintageButton, Divider } from '@/components/ui';

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function getEmailRedirectTo(): string {
    // Web needs an HTTP URL, native can use the app scheme URL.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/`;
    }
    return Linking.createURL('/');
  }

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!isSupabaseConfigured) {
      setError('SET EXPO_PUBLIC_SUPABASE_URL AND ANON KEY IN .ENV (SUPABASE DASHBOARD → API)');
      return;
    }
    if (!email.trim() || !password) {
      setError('EMAIL AND PASSWORD REQUIRED');
      return;
    }
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message.toUpperCase());
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
        },
      });
      if (error) setError(error.message.toUpperCase());
      else setMessage('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header ornament */}
          <VintageText variant="mono" size="xl" color={Theme.colors.gold} align="center" style={styles.ornament}>
            ═══════════════
          </VintageText>

          <VintageText variant="pixel" size="lg" color={Theme.colors.ink} align="center" style={styles.appTitle}>
            ALMANAC
          </VintageText>

          <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.tagline}>
            YOUR DAILY HABIT LEDGER
          </VintageText>

          <VintageText variant="mono" size="xs" color={Theme.colors.gold} align="center" style={styles.ornamentBottom}>
            ═══════════════
          </VintageText>

          <Divider marginVertical={Theme.spacing.xl} />

          {!isSupabaseConfigured && (
            <View style={styles.setupBanner}>
              <VintageText variant="mono" size="xs" color={Theme.colors.red}>
                SUPABASE IS NOT CONFIGURED. EDIT .ENV AND SET EXPO_PUBLIC_SUPABASE_URL AND
                EXPO_PUBLIC_SUPABASE_ANON_KEY FROM YOUR PROJECT (SETTINGS → API).
              </VintageText>
            </View>
          )}

          {/* Auth form */}
          <View style={styles.formBox}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.formTitle}>
              {mode === 'login' ? '// LOGIN' : '// REGISTER'}
            </VintageText>
            <Divider marginVertical={Theme.spacing.sm} />

            <VintageInput
              label="Email Address"
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
              placeholder="user@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <VintageInput
              label="Password"
              value={password}
              onChangeText={t => { setPassword(t); setError(''); }}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(prev => !prev)}
              style={styles.togglePasswordBtn}
              activeOpacity={0.7}
            >
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                {showPassword ? 'HIDE PASSWORD' : 'SHOW PASSWORD'}
              </VintageText>
            </TouchableOpacity>

            {!!error && (
              <View style={styles.errorBox}>
                <VintageText variant="mono" size="xs" color={Theme.colors.red}>
                  ⚠ {error}
                </VintageText>
              </View>
            )}
            {!!message && (
              <View style={styles.successBox}>
                <VintageText variant="mono" size="xs" color={Theme.colors.green}>
                  ✓ {message}
                </VintageText>
                {mode === 'signup' && (
                  <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.helpText}>
                    IF THE LINK OPENS A WRONG HOST, ADD YOUR APP URL IN SUPABASE AUTH → URL CONFIGURATION.
                  </VintageText>
                )}
              </View>
            )}

            <VintageButton
              label={loading ? 'PLEASE WAIT...' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
              onPress={handleSubmit}
              disabled={loading || !isSupabaseConfigured}
              fullWidth
              style={styles.submitBtn}
              size="md"
            />
          </View>

          <Divider marginVertical={Theme.spacing.lg} label="OR" />

          <VintageButton
            label={mode === 'login' ? 'CREATE NEW ACCOUNT' : 'ALREADY HAVE ACCOUNT?'}
            variant="ghost"
            onPress={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
            fullWidth
          />

          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} align="center" style={styles.footer}>
            © ALMANAC HABIT TRACKER
          </VintageText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xl,
    justifyContent: 'center',
  },
  ornament: {
    letterSpacing: 4,
    marginBottom: Theme.spacing.md,
  },
  appTitle: {
    letterSpacing: 8,
    marginBottom: Theme.spacing.sm,
  },
  tagline: {
    letterSpacing: 3,
  },
  ornamentBottom: {
    letterSpacing: 4,
    marginTop: Theme.spacing.sm,
  },
  setupBanner: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.red,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.paper,
  },
  formBox: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
  },
  formTitle: {
    letterSpacing: 2,
  },
  submitBtn: {
    marginTop: Theme.spacing.md,
  },
  togglePasswordBtn: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    marginTop: -Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Theme.colors.red,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  successBox: {
    borderWidth: 1,
    borderColor: Theme.colors.green,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  helpText: {
    marginTop: Theme.spacing.xs,
  },
  footer: {
    marginTop: Theme.spacing.xl,
    letterSpacing: 2,
  },
});
