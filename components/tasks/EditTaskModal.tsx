import React, { useMemo, useState } from 'react';
import { Modal, View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { VintageText, VintageButton, VintageInput, Divider } from '@/components/ui';
import { Theme } from '@/constants/theme';
import { Category, Subcategory, RepeatSchedule, TaskWithStatus, ReminderSettings } from '@/lib/types';
import { RichTextEditor } from './RichTextEditor';
import { ReminderEditor } from '@/components/reminders/ReminderEditor';

interface EditTaskModalProps {
  visible: boolean;
  task: TaskWithStatus | null;
  categories: Category[];
  subcategories: Subcategory[];
  onClose: () => void;
  onSave: (id: string, data: Partial<TaskWithStatus>) => Promise<void>;
}

const REPEAT_OPTIONS: { label: string; value: RepeatSchedule }[] = [
  { label: 'NONE', value: 'none' },
  { label: 'DAILY', value: 'daily' },
  { label: 'WEEKDAYS', value: 'weekdays' },
  { label: 'WEEKENDS', value: 'weekends' },
  { label: 'CUSTOM', value: 'custom' },
];
const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function EditTaskModal({ visible, task, categories, subcategories, onClose, onSave }: EditTaskModalProps) {
  const [saving, setSaving] = useState(false);
  const [nameSegments, setNameSegments] = useState(task?.rich_text_name ?? []);
  const [categoryId, setCategoryId] = useState<string | null>(task?.category_id ?? null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(task?.subcategory_id ?? null);
  const [time, setTime] = useState(task?.scheduled_time ?? '');
  const [repeat, setRepeat] = useState<RepeatSchedule>(task?.repeat_schedule ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(task?.custom_days ?? []);
  const [reminder, setReminder] = useState<ReminderSettings | null>(task?.reminder_settings ?? null);
  const [highlighted, setHighlighted] = useState<boolean>(task?.highlighted ?? false);
  const [trackerEnabled, setTrackerEnabled] = useState<boolean>(task?.tracker_enabled ?? false);
  const [trackerNickname, setTrackerNickname] = useState<string>(task?.tracker_nickname ?? '');

  React.useEffect(() => {
    setNameSegments(task?.rich_text_name ?? []);
    setCategoryId(task?.category_id ?? null);
    setSubcategoryId(task?.subcategory_id ?? null);
    setTime(task?.scheduled_time ?? '');
    setRepeat(task?.repeat_schedule ?? 'daily');
    setCustomDays(task?.custom_days ?? []);
    setReminder(task?.reminder_settings ?? null);
    setHighlighted(task?.highlighted ?? false);
    setTrackerEnabled(task?.tracker_enabled ?? false);
    setTrackerNickname(task?.tracker_nickname ?? '');
  }, [task?.id]);

  const availableSubs = useMemo(
    () => categoryId ? subcategories.filter(s => s.category_id === categoryId) : [],
    [categoryId, subcategories]
  );

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <VintageText variant="pixel" size="xs" color={Theme.colors.ink}>EDIT TASK</VintageText>
            <TouchableOpacity onPress={onClose}><VintageText variant="mono" size="lg" color={Theme.colors.muted}>×</VintageText></TouchableOpacity>
          </View>
          <Divider marginVertical={Theme.spacing.sm} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>TASK NAME</VintageText>
            <RichTextEditor segments={nameSegments} onChangeSegments={setNameSegments} />

            <VintageInput
              label="Time (optional)"
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />

            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>CATEGORY</VintageText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              <TouchableOpacity style={[styles.chip, !categoryId && styles.chipActive]} onPress={() => { setCategoryId(null); setSubcategoryId(null); }}>
                <VintageText variant="mono" size="xs" color={!categoryId ? Theme.colors.paper : Theme.colors.ink}>NONE</VintageText>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => { setCategoryId(cat.id); setSubcategoryId(null); }}
                >
                  <VintageText variant="mono" size="xs" color={categoryId === cat.id ? Theme.colors.paper : cat.color}>
                    {cat.icon} {cat.name.toUpperCase()}
                  </VintageText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {availableSubs.length > 0 ? (
              <>
                <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>SUBCATEGORY</VintageText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
                  <TouchableOpacity style={[styles.chip, !subcategoryId && styles.chipActive]} onPress={() => setSubcategoryId(null)}>
                    <VintageText variant="mono" size="xs" color={!subcategoryId ? Theme.colors.paper : Theme.colors.ink}>NONE</VintageText>
                  </TouchableOpacity>
                  {availableSubs.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.chip, subcategoryId === sub.id && styles.chipActive]}
                      onPress={() => setSubcategoryId(sub.id)}
                    >
                      <VintageText variant="mono" size="xs" color={subcategoryId === sub.id ? Theme.colors.paper : Theme.colors.ink}>
                        ◈ {sub.name.toUpperCase()}
                      </VintageText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>REPEAT</VintageText>
            <View style={styles.wrapRow}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.chip, repeat === opt.value && styles.chipActive]} onPress={() => setRepeat(opt.value)}>
                  <VintageText variant="mono" size="xs" color={repeat === opt.value ? Theme.colors.paper : Theme.colors.ink}>{opt.label}</VintageText>
                </TouchableOpacity>
              ))}
            </View>

            {repeat === 'custom' ? (
              <View style={styles.wrapRow}>
                {DAY_LABELS.map((d, i) => {
                  const active = customDays.includes(i);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => setCustomDays(prev => active ? prev.filter(x => x !== i) : [...prev, i])}
                    >
                      <VintageText variant="mono" size="xs" color={active ? Theme.colors.paper : Theme.colors.ink}>{d}</VintageText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.highlightRow}>
              <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>HIGHLIGHT ON HOME</VintageText>
              <TouchableOpacity
                style={[styles.highlightToggle, highlighted && styles.highlightToggleOn]}
                onPress={() => setHighlighted(v => !v)}
              >
                <VintageText variant="mono" size="xs" color={highlighted ? Theme.colors.paper : Theme.colors.ink}>
                  {highlighted ? 'ON' : 'OFF'}
                </VintageText>
              </TouchableOpacity>
            </View>

            <View style={styles.trackerRow}>
              <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>SHOW ON TRACKER</VintageText>
              <TouchableOpacity
                style={[styles.highlightToggle, trackerEnabled && styles.highlightToggleOn]}
                onPress={() => setTrackerEnabled(v => !v)}
              >
                <VintageText variant="mono" size="xs" color={trackerEnabled ? Theme.colors.paper : Theme.colors.ink}>
                  {trackerEnabled ? 'ON' : 'OFF'}
                </VintageText>
              </TouchableOpacity>
            </View>

            <VintageInput
              label="TRACKER NICKNAME (optional)"
              value={trackerNickname}
              onChangeText={setTrackerNickname}
              placeholder="e.g. Morning Run"
              maxLength={24}
            />

            <ReminderEditor title="SET REMINDER" value={reminder} onChange={setReminder} />
          </ScrollView>

          <Divider marginVertical={Theme.spacing.sm} />
          <View style={styles.actions}>
            <VintageButton label="CANCEL" variant="ghost" size="sm" onPress={onClose} />
            <VintageButton
              label={saving ? 'SAVING...' : 'SAVE'}
              size="sm"
              onPress={async () => {
                setSaving(true);
                const plainName = nameSegments.map(s => s.text).join('').trim();
                await onSave(task.id, {
                  name: plainName || task.name,
                  rich_text_name: nameSegments.length ? nameSegments : null,
                  category_id: categoryId,
                  subcategory_id: subcategoryId,
                  scheduled_time: time || null,
                  repeat_schedule: repeat,
                  custom_days: repeat === 'custom' ? customDays : null,
                  reminder_settings: reminder,
                  highlighted,
                tracker_enabled: trackerEnabled,
                tracker_nickname: trackerNickname.trim() ? trackerNickname.trim() : null,
                });
                setSaving(false);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    backgroundColor: Theme.colors.background,
    borderTopWidth: 2,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  row: {
    marginBottom: Theme.spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    marginRight: Theme.spacing.xs,
  },
  chipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  dayChip: {
    width: 30,
    height: 28,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Theme.colors.gold,
    borderColor: Theme.colors.goldDark,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  highlightToggle: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  highlightToggleOn: {
    backgroundColor: Theme.colors.gold,
    borderColor: Theme.colors.goldDark,
  },
});
