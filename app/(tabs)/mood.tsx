import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScreenLayout, VintageText, Divider } from '@/components/ui';
import { MoodSelector } from '@/components/mood/MoodSelector';
import { JournalEntry } from '@/components/mood/JournalEntry';
import { MoodHistory } from '@/components/mood/MoodHistory';
import { useMood } from '@/hooks/useMood';
import { Theme } from '@/constants/theme';
import { MoodLevel } from '@/lib/types';
import { MoodEntry } from '@/lib/types';
import { formatShortDate, fromDateKey } from '@/lib/dateUtils';
import { journalSegmentsToPlainText, parseJournalSegments } from '@/lib/journalRichText';

export default function MoodScreen() {
  const { entries, todayEntry, saveEntry } = useMood();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [openNote, setOpenNote] = useState<MoodEntry | null>(null);

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
      <MoodHistory
        entries={entries.filter(e => e.entry_date !== (todayEntry?.entry_date ?? '__'))}
        onOpen={setOpenNote}
      />

      <Modal visible={!!openNote} transparent animationType="fade" onRequestClose={() => setOpenNote(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint}>
              JOURNAL NOTE
            </VintageText>

            <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.modalDate}>
              {openNote ? formatShortDate(fromDateKey(openNote.entry_date)) : ''}
            </VintageText>

            <ScrollView style={styles.modalBody}>
              {openNote?.journal_text ? (
                (() => {
                  const plain = journalSegmentsToPlainText(parseJournalSegments(openNote.journal_text ?? null));
                  const lines = plain.split('\n');
                  const title = (lines[0] ?? '').trim();
                  const rest = lines.slice(1).join('\n').trim();
                  return (
                    <View>
                      <VintageText
                        variant="mono"
                        size="sm"
                        color={Theme.colors.ink}
                        style={styles.modalTitle}
                      >
                        {title.length ? title : '[no title]'}
                      </VintageText>
                      {rest.length ? (
                        <VintageText variant="mono" size="xs" color={Theme.colors.ink} style={styles.modalText}>
                          {rest}
                        </VintageText>
                      ) : (
                        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.modalText}>
                          [no additional lines]
                        </VintageText>
                      )}
                    </View>
                  );
                })()
              ) : (
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
                  [no journal entry]
                </VintageText>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpenNote(null)}>
              <VintageText variant="mono" size="xs" color={Theme.colors.muted}>
                × CLOSE
              </VintageText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: Theme.colors.paper,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.none,
  },
  modalDate: {
    marginTop: 6,
    marginBottom: Theme.spacing.sm,
  },
  modalBody: {
    flexGrow: 0,
    maxHeight: 280,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalText: {
    lineHeight: Theme.fontSize.monoSm * 1.55,
  },
  closeBtn: {
    marginTop: Theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
    borderTopWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
});
