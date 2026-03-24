import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VintageText, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodEntry, MoodLevel } from '@/lib/types';
import { formatShortDate, fromDateKey } from '@/lib/dateUtils';

const MOOD_SYMBOLS: Record<MoodLevel, { symbol: string; color: string }> = {
  1: { symbol: '▼▼', color: Theme.colors.red },
  2: { symbol: '▼',  color: Theme.colors.redLight },
  3: { symbol: '—',  color: Theme.colors.muted },
  4: { symbol: '▲',  color: Theme.colors.green },
  5: { symbol: '▲▲', color: Theme.colors.greenDark },
};

interface MoodHistoryProps {
  entries: MoodEntry[];
}

export function MoodHistory({ entries }: MoodHistoryProps) {
  if (entries.length === 0) {
    return (
      <VintageText variant="mono" size="sm" color={Theme.colors.muted} align="center" style={styles.empty}>
        NO ENTRIES YET
      </VintageText>
    );
  }

  return (
    <View style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        PAST ENTRIES
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />
      {entries.slice(0, 30).map((entry, idx) => {
        const mood = MOOD_SYMBOLS[entry.mood_level as MoodLevel];
        return (
          <View key={entry.id}>
            <View style={styles.row}>
              <View style={[styles.moodTag, { borderColor: mood.color }]}>
                <VintageText variant="mono" size="sm" color={mood.color} align="center">
                  {mood.symbol}
                </VintageText>
              </View>
              <View style={styles.entryContent}>
                <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.date}>
                  {formatShortDate(fromDateKey(entry.entry_date))}
                </VintageText>
                {entry.journal_text ? (
                  <VintageText
                    variant="mono"
                    size="sm"
                    color={Theme.colors.ink}
                    numberOfLines={2}
                    style={styles.journal}
                  >
                    {entry.journal_text}
                  </VintageText>
                ) : (
                  <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
                    [no journal entry]
                  </VintageText>
                )}
              </View>
            </View>
            {idx < entries.length - 1 && <Divider marginVertical={6} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  empty: {
    marginTop: Theme.spacing.xl,
    letterSpacing: 2,
  },
  heading: {
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  moodTag: {
    borderWidth: 1,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryContent: {
    flex: 1,
  },
  date: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  journal: {
    lineHeight: Theme.fontSize.monoSm * 1.5,
  },
});
