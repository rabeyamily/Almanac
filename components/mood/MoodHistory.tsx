import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { VintageText, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodEntry, MoodLevel } from '@/lib/types';
import { formatShortDate, fromDateKey } from '@/lib/dateUtils';
import { journalSegmentsToPlainText, parseJournalSegments } from '@/lib/journalRichText';

const MOOD_SYMBOLS: Record<MoodLevel, { symbol: string; color: string }> = {
  1: { symbol: '▼▼', color: Theme.colors.red },
  2: { symbol: '▼',  color: Theme.colors.redLight },
  3: { symbol: '—',  color: Theme.colors.muted },
  4: { symbol: '▲',  color: Theme.colors.green },
  5: { symbol: '▲▲', color: Theme.colors.greenDark },
};

interface MoodHistoryProps {
  entries: MoodEntry[];
  onOpen?: (entry: MoodEntry) => void;
}

export function MoodHistory({ entries, onOpen }: MoodHistoryProps) {
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
        const journalPlain = journalSegmentsToPlainText(parseJournalSegments(entry.journal_text ?? null));
        const lines = journalPlain.split('\n');
        const firstLine = (lines[0] ?? '').trim();
        const titleOrDate = firstLine.length > 0 ? firstLine : formatShortDate(fromDateKey(entry.entry_date));
        const previewLine = firstLine.length > 0 ? firstLine : '[no journal entry]';
        return (
          <View key={entry.id}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onOpen?.(entry)}
              style={styles.row}
            >
              <View style={[styles.moodTag, { borderColor: mood.color }]}>
                <VintageText variant="mono" size="sm" color={mood.color} align="center">
                  {mood.symbol}
                </VintageText>
              </View>
              <View style={styles.entryContent}>
                <VintageText variant="mono" size="xs" color={Theme.colors.ink} numberOfLines={1} style={styles.titleLine}>
                  {titleOrDate}
                </VintageText>
                <VintageText variant="mono" size="xs" color={Theme.colors.muted} numberOfLines={1} style={styles.previewLine}>
                  {previewLine}
                </VintageText>
              </View>
            </TouchableOpacity>
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
    paddingVertical: 6,
  },
  moodTag: {
    borderWidth: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryContent: {
    flex: 1,
  },
  titleLine: {
    color: Theme.colors.ink,
    letterSpacing: 0.8,
    fontSize: 13,
    marginBottom: 2,
  },
  previewLine: {
    fontSize: 13,
    lineHeight: 18,
  },
});
