import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenLayout, VintageText, Divider } from '@/components/ui';
import { MoodSelector } from '@/components/mood/MoodSelector';
import { JournalEntry } from '@/components/mood/JournalEntry';
import { MoodHistory } from '@/components/mood/MoodHistory';
import { useMood } from '@/hooks/useMood';
import { Theme } from '@/constants/theme';
import { MoodLevel } from '@/lib/types';

export default function MoodScreen() {
  const { entries, todayEntry, saveEntry } = useMood();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync today's entry into state when it loads
  useEffect(() => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood_level as MoodLevel);
    }
  }, [todayEntry]);

  const handleMoodSelect = async (level: MoodLevel) => {
    setSelectedMood(level);
    // Auto-save mood selection immediately; journal saved separately
    setSaving(true);
    await saveEntry(new Date(), level, todayEntry?.journal_text ?? '');
    setSaving(false);
  };

  const handleJournalSave = async (text: string) => {
    if (selectedMood) {
      setSaving(true);
      await saveEntry(new Date(), selectedMood, text);
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <VintageText variant="pixel" size="sm" color={Theme.colors.ink} style={styles.heading}>
        MOOD & JOURNAL
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      {/* Mood selector */}
      <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

      {saving && (
        <VintageText variant="mono" size="xs" color={Theme.colors.gold} style={styles.savingNote}>
          SAVING...
        </VintageText>
      )}

      {/* Journal entry */}
      <JournalEntry
        entry={todayEntry}
        onSave={handleJournalSave}
        isSaving={saving}
      />

      <Divider marginVertical={Theme.spacing.lg} />

      {/* Past mood entries */}
      <MoodHistory entries={entries.filter(e => e.entry_date !== (todayEntry?.entry_date ?? '__'))} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    letterSpacing: 2,
  },
  savingNote: {
    letterSpacing: 2,
    marginTop: -Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
});
