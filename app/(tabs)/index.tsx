import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout, VintageText, Divider, VintageBox } from '@/components/ui';
import { LiveClock } from '@/components/home/LiveClock';
import { ProgressOverview } from '@/components/home/ProgressOverview';
import { QuickNav } from '@/components/home/QuickNav';
import { RichTextRenderer } from '@/components/tasks/RichTextRenderer';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Theme } from '@/constants/theme';

export default function HomeScreen() {
  const { tasks, toggleComplete } = useTasks();
  const { user } = useAuth();
  const router = useRouter();

  const completed = tasks.filter(t => t.is_completed).length;
  const pinned = tasks.filter(t => t.highlighted);

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

      <LiveClock />

      <Divider marginVertical={Theme.spacing.sm} />

      <ProgressOverview completed={completed} total={tasks.length} />

      {/* Pinned / highlighted tasks */}
      {pinned.length > 0 ? (
        <VintageBox borderStyle="single" style={styles.pinnedSection}>
          <View style={styles.pinnedHeader}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.gold} style={styles.pinnedTitle}>
              ★ PINNED TASKS
            </VintageText>
            <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
              {pinned.filter(t => t.is_completed).length}/{pinned.length}
            </VintageText>
          </View>

          {pinned.map(task => {
            const hasRich = task.rich_text_name && task.rich_text_name.length > 0;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.pinnedTask, task.is_completed && styles.pinnedTaskDone]}
                onPress={() => toggleComplete(task.id, !task.is_completed)}
                activeOpacity={0.7}
              >
                <View style={[styles.pinnedCheck, task.is_completed && styles.pinnedCheckDone]}>
                  {task.is_completed ? (
                    <VintageText variant="mono" size="xs" color={Theme.colors.paper} align="center">✓</VintageText>
                  ) : null}
                </View>
                <View style={styles.pinnedContent}>
                  {hasRich ? (
                    <RichTextRenderer segments={task.rich_text_name!} dimmed={task.is_completed} />
                  ) : (
                    <VintageText
                      variant="mono"
                      size="sm"
                      color={task.is_completed ? Theme.colors.muted : Theme.colors.ink}
                    >
                      {task.name}
                    </VintageText>
                  )}
                  <View style={styles.pinnedMeta}>
                    {task.category ? (
                      <VintageText variant="mono" size="xs" color={task.category.color}>
                        ✦ {task.category.name.toUpperCase()}
                      </VintageText>
                    ) : null}
                    <VintageText variant="mono" size="xs" color={Theme.colors.borderLight}>
                      {task.repeat_schedule.toUpperCase()}
                    </VintageText>
                  </View>
                </View>
                {task.is_completed ? (
                  <VintageText variant="pixel" size="xs" color={Theme.colors.green}>✓</VintageText>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </VintageBox>
      ) : null}

      <QuickNav />

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
  pinnedSection: {
    marginBottom: Theme.spacing.md,
    borderColor: Theme.colors.gold,
    backgroundColor: Theme.colors.paper,
    padding: Theme.spacing.sm,
  },
  pinnedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  pinnedTitle: {
    letterSpacing: 2,
  },
  pinnedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderTopWidth: 1,
    borderColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  pinnedTaskDone: {
    opacity: 0.5,
  },
  pinnedCheck: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedCheckDone: {
    backgroundColor: Theme.colors.green,
    borderColor: Theme.colors.greenDark,
  },
  pinnedContent: {
    flex: 1,
  },
  pinnedMeta: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginTop: 2,
  },
  userRow: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
});
