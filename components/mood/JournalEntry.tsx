import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { VintageText, VintageBox, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { MoodEntry } from '@/lib/types';
import { formatShortDate, fromDateKey } from '@/lib/dateUtils';

interface JournalEntryProps {
  entry: MoodEntry | null;
  onSave: (text: string) => void;
  isSaving: boolean;
}

export function JournalEntry({ entry, onSave, isSaving }: JournalEntryProps) {
  const [text, setText] = useState(entry?.journal_text ?? '');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(text);
    setEditing(false);
  };

  return (
    <VintageBox borderStyle="single" style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.heading}>
        JOURNAL — TODAY
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        onFocus={() => setEditing(true)}
        multiline
        numberOfLines={6}
        placeholder="Write your thoughts for today..."
        placeholderTextColor={Theme.colors.inkFaint}
        selectionColor={Theme.colors.gold}
        textAlignVertical="top"
      />

      {editing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: Theme.colors.green }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <VintageText variant="mono" size="sm" color={Theme.colors.green}>
              {isSaving ? 'SAVING...' : '✓ SAVE ENTRY'}
            </VintageText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: Theme.colors.muted }]}
            onPress={() => { setText(entry?.journal_text ?? ''); setEditing(false); }}
          >
            <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
              × CANCEL
            </VintageText>
          </TouchableOpacity>
        </View>
      )}
    </VintageBox>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  heading: {
    letterSpacing: 2,
    marginBottom: 4,
  },
  input: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    minHeight: 120,
    lineHeight: Theme.fontSize.monoMd * 1.6,
    paddingTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  saveBtn: {
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
});
