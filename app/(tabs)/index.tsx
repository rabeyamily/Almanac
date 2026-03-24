import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, VintageText, Divider } from '@/components/ui';
import { LiveClock } from '@/components/home/LiveClock';
import { ProgressOverview } from '@/components/home/ProgressOverview';
import { QuickNav } from '@/components/home/QuickNav';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Theme } from '@/constants/theme';

export default function HomeScreen() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const router = useRouter();

  const completed = tasks.filter(t => t.is_completed).length;

  return (
    <ScreenLayout>
      {/* Top bar */}
      <View style={styles.topBar}>
        <VintageText variant="pixel" size="sm" color={Theme.colors.ink} style={styles.brand}>
          ALMANAC
        </VintageText>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/categories')}
          >
            <VintageText variant="mono" size="lg" color={Theme.colors.muted}>▦</VintageText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => supabase.auth.signOut()}
          >
            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>⏻</VintageText>
          </TouchableOpacity>
        </View>
      </View>

      <Divider marginVertical={Theme.spacing.sm} />

      {/* Live clock + date */}
      <LiveClock />

      <Divider marginVertical={Theme.spacing.sm} />

      {/* Progress overview */}
      <ProgressOverview completed={completed} total={tasks.length} />

      {/* Quick navigation tiles */}
      <QuickNav />

      {/* User email */}
      <View style={styles.userRow}>
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
          LOGGED IN AS: {user?.email?.toUpperCase() ?? '—'}
        </VintageText>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Theme.spacing.xs,
  },
  brand: {
    letterSpacing: 4,
  },
  topRight: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'center',
  },
  settingsBtn: {
    padding: Theme.spacing.xs,
  },
  userRow: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
});
