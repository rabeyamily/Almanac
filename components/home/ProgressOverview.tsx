import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VintageText, VintageBox } from '@/components/ui';
import { Theme } from '@/constants/theme';

interface ProgressOverviewProps {
  completed: number;
  total: number;
}

export function ProgressOverview({ completed, total }: ProgressOverviewProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  // Build a pixel-style progress bar using block characters
  const BAR_LENGTH = 20;
  const filled = Math.round((completed / Math.max(total, 1)) * BAR_LENGTH);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled);

  const statusMessage =
    total === 0
      ? 'NO TASKS TODAY'
      : completed === total
      ? 'ALL DONE! ★'
      : completed === 0
      ? 'LET\'S BEGIN...'
      : `${total - completed} REMAINING`;

  return (
    <VintageBox borderStyle="double" style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.label}>
        TODAY'S PROGRESS
      </VintageText>

      <View style={styles.statsRow}>
        <VintageText variant="pixel" size="lg" color={Theme.colors.ink}>
          {completed}
        </VintageText>
        <VintageText variant="mono" size="lg" color={Theme.colors.muted} style={styles.separator}>
          /
        </VintageText>
        <VintageText variant="pixel" size="lg" color={Theme.colors.inkFaint}>
          {total}
        </VintageText>
        <VintageText variant="mono" size="sm" color={Theme.colors.inkFaint} style={styles.pct}>
          ({percentage}%)
        </VintageText>
      </View>

      <VintageText
        variant="mono"
        size="xs"
        color={completed === total && total > 0 ? Theme.colors.green : Theme.colors.gold}
        style={styles.bar}
      >
        {bar}
      </VintageText>

      <VintageText
        variant="mono"
        size="sm"
        color={Theme.colors.muted}
        style={styles.status}
      >
        {statusMessage}
      </VintageText>
    </VintageBox>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.md,
  },
  label: {
    letterSpacing: 2,
    marginBottom: Theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Theme.spacing.sm,
    gap: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  pct: {
    marginLeft: Theme.spacing.sm,
  },
  bar: {
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
  },
  status: {
    letterSpacing: 2,
  },
});
