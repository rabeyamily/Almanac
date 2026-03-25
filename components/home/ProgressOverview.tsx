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
  const ratio = total === 0 ? 0 : completed / total;
  const BAR_LENGTH = 24;
  const filled = Math.round(ratio * BAR_LENGTH);
  const isComplete = total > 0 && completed === total;

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

      <View style={styles.barOuter}>
        <View
          style={[
            styles.barInner,
            { opacity: total === 0 ? 0.25 : 1 },
          ]}
        >
          {Array.from({ length: BAR_LENGTH }).map((_, idx) => {
            const shouldFill = idx < filled;
            return (
              <View
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                style={[
                  styles.barSeg,
                  {
                    backgroundColor: shouldFill
                      ? isComplete
                        ? Theme.colors.green
                        : Theme.colors.gold
                      : Theme.colors.borderLight,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
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
  barOuter: {
    width: '100%',
    marginTop: 0,
    paddingHorizontal: 0, // fill inside VintageBox padding
    marginBottom: Theme.spacing.sm,
  },
  barInner: {
    flexDirection: 'row',
    width: '100%',
    height: 14,
  },
  barSeg: {
    flex: 1,
    height: 14,
    borderRadius: 0,
  },
});
