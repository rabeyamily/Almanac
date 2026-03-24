import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { VintageText, VintageInput, VintageButton, VintageBox, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { Category, RepeatSchedule, Task } from '@/lib/types';

interface AddTaskFormProps {
  categories: Category[];
  onSave: (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onClose: () => void;
}

const REPEAT_OPTIONS: { label: string; value: RepeatSchedule }[] = [
  { label: 'NONE', value: 'none' },
  { label: 'DAILY', value: 'daily' },
  { label: 'WEEKDAYS', value: 'weekdays' },
  { label: 'WEEKENDS', value: 'weekends' },
];

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function AddTaskForm({ categories, onSave, onClose }: AddTaskFormProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatSchedule>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (d: number) =>
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!name.trim()) { setError('NAME REQUIRED'); return; }
    setSaving(true);
    await onSave({
      name: name.trim(),
      category_id: categoryId,
      scheduled_time: scheduledTime || null,
      repeat_schedule: repeat,
      custom_days: repeat === 'custom' ? customDays : null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <VintageBox borderStyle="double" style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.title}>
        + NEW TASK
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      <VintageInput
        label="Task Name"
        value={name}
        onChangeText={t => { setName(t); setError(''); }}
        placeholder="e.g. Morning Jog..."
        error={error}
        autoFocus
      />

      <VintageInput
        label="Time (optional)"
        value={scheduledTime}
        onChangeText={setScheduledTime}
        placeholder="HH:MM"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />

      {/* Category picker */}
      <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
        CATEGORY
      </VintageText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        <TouchableOpacity
          style={[styles.catChip, !categoryId && styles.catChipActive]}
          onPress={() => setCategoryId(null)}
        >
          <VintageText variant="mono" size="xs" color={!categoryId ? Theme.colors.paper : Theme.colors.ink}>
            NONE
          </VintageText>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => setCategoryId(cat.id)}
          >
            <VintageText variant="mono" size="xs" color={categoryId === cat.id ? Theme.colors.paper : cat.color}>
              {cat.icon} {cat.name.toUpperCase()}
            </VintageText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Repeat schedule */}
      <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
        REPEAT
      </VintageText>
      <View style={styles.repeatRow}>
        {REPEAT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.repeatChip, repeat === opt.value && styles.repeatChipActive]}
            onPress={() => setRepeat(opt.value)}
          >
            <VintageText
              variant="mono"
              size="xs"
              color={repeat === opt.value ? Theme.colors.paper : Theme.colors.ink}
            >
              {opt.label}
            </VintageText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom day picker */}
      {repeat === 'custom' && (
        <View style={styles.daysRow}>
          {DAY_LABELS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, customDays.includes(i) && styles.dayChipActive]}
              onPress={() => toggleDay(i)}
            >
              <VintageText
                variant="mono"
                size="xs"
                color={customDays.includes(i) ? Theme.colors.paper : Theme.colors.ink}
              >
                {d}
              </VintageText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Divider marginVertical={Theme.spacing.sm} />
      <View style={styles.actions}>
        <VintageButton label="CANCEL" variant="ghost" onPress={onClose} size="sm" />
        <VintageButton label={saving ? 'SAVING...' : 'SAVE TASK'} onPress={handleSave} disabled={saving} size="sm" />
      </View>
    </VintageBox>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  title: {
    letterSpacing: 2,
    marginBottom: 4,
  },
  pickerLabel: {
    letterSpacing: 1,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  catScroll: {
    marginBottom: Theme.spacing.sm,
  },
  catChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: Theme.spacing.xs,
    backgroundColor: Theme.colors.paper,
  },
  catChipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  repeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  repeatChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.paper,
  },
  repeatChipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.paper,
  },
  dayChipActive: {
    backgroundColor: Theme.colors.gold,
    borderColor: Theme.colors.goldDark,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    justifyContent: 'flex-end',
  },
});
