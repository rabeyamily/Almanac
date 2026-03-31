import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { VintageText, VintageInput, VintageButton, VintageBox, Divider } from '@/components/ui';
import { RichTextEditor } from './RichTextEditor';
import { ReminderEditor } from '@/components/reminders/ReminderEditor';
import { Theme } from '@/constants/theme';
import { Category, Subcategory, RepeatSchedule, Task, RichTextSegment, ReminderSettings } from '@/lib/types';
import { generateTasksFromText } from '@/lib/gemini';

interface AddTaskFormProps {
  categories: Category[];
  subcategories: Subcategory[];
  onSave: (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
  initialMode?: AddMode;
}

const REPEAT_OPTIONS: { label: string; value: RepeatSchedule }[] = [
  { label: 'NONE', value: 'none' },
  { label: 'DAILY', value: 'daily' },
  { label: 'WEEKDAYS', value: 'weekdays' },
  { label: 'WEEKENDS', value: 'weekends' },
];

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
type AddMode = 'manual' | 'ai';

export function AddTaskForm({ categories, subcategories, onSave, onClose, initialMode = 'manual' }: AddTaskFormProps) {
  const [mode, setMode] = useState<AddMode>(initialMode);
  const [richSegments, setRichSegments] = useState<RichTextSegment[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatSchedule>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminder, setReminder] = useState<ReminderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiFeedbackError, setAiFeedbackError] = useState(false);

  const availableSubs = useMemo(
    () => categoryId ? subcategories.filter(s => s.category_id === categoryId) : [],
    [categoryId, subcategories]
  );

  const toggleDay = (d: number) =>
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    const plainName = richSegments.map(s => s.text).join('').trim();
    if (!plainName) { setError('NAME REQUIRED'); return; }
    setSaving(true);
    const ok = await onSave({
      name: plainName,
      rich_text_name: richSegments.length > 0 ? richSegments : null,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      scheduled_time: scheduledTime || null,
      repeat_schedule: repeat,
      custom_days: repeat === 'custom' ? customDays : null,
      highlighted: false,
      order_index: 0,
      reminder_settings: reminder,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('FAILED TO SAVE TASK');
  };

  const handleAiCreate = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiFeedbackError(true);
      setAiFeedback('DESCRIBE A FEW TASKS FIRST');
      return;
    }

    setSaving(true);
    setAiFeedback('');
    setAiFeedbackError(false);
    setError('');

    try {
      const generated = await generateTasksFromText(prompt);
      if (!generated.length) {
        setAiFeedbackError(true);
        setAiFeedback("Couldn't parse tasks, try rephrasing");
        return;
      }

      let successCount = 0;
      for (const item of generated) {
        const repeatSchedule: RepeatSchedule = item.category === 'habit' ? 'daily' : 'none';
        const reminderSettings: ReminderSettings | null = item.category === 'reminder'
          ? {
              enabled: true,
              frequency: 'daily',
              date: null,
              time: item.time,
              custom_days: null,
              message: item.title,
              notification_ids: null,
            }
          : null;

        const ok = await onSave({
          name: item.title,
          rich_text_name: [{ text: item.title }],
          category_id: null,
          subcategory_id: null,
          scheduled_time: item.time,
          repeat_schedule: repeatSchedule,
          custom_days: null,
          highlighted: false,
          order_index: 0,
          reminder_settings: reminderSettings,
        });

        if (ok) successCount += 1;
      }

      if (successCount > 0) {
        setAiFeedbackError(false);
        setAiFeedback(`${successCount} tasks added!`);
        setAiPrompt('');
      } else {
        setAiFeedbackError(true);
        setAiFeedback('FAILED TO SAVE TASKS');
      }
    } catch {
      setAiFeedbackError(true);
      setAiFeedback("Couldn't parse tasks, try rephrasing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VintageBox borderStyle="double" style={styles.container}>
      <VintageText variant="pixel" size="xs" color={Theme.colors.inkFaint} style={styles.title}>
        + NEW TASK
      </VintageText>
      <Divider marginVertical={Theme.spacing.sm} />

      <View style={styles.modeSwitch}>
        {(['manual', 'ai'] as AddMode[]).map(tab => {
          const active = mode === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.modeTab, active && styles.modeTabActive]}
              onPress={() => {
                setMode(tab);
                setError('');
                setAiFeedback('');
              }}
            >
              <VintageText variant="mono" size="xs" color={active ? Theme.colors.paper : Theme.colors.inkFaint}>
                {tab === 'manual' ? 'MANUAL' : 'AI'}
              </VintageText>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'manual' ? (
        <>
          {/* Rich text task name */}
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
            TASK NAME
          </VintageText>
          <RichTextEditor
            segments={richSegments}
            onChangeSegments={(segs) => { setRichSegments(segs); setError(''); }}
            placeholder="e.g. Morning Jog..."
            autoFocus
          />
          {error ? (
            <VintageText variant="mono" size="xs" color={Theme.colors.red} style={styles.errorText}>
              {error}
            </VintageText>
          ) : null}

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
              onPress={() => { setCategoryId(null); setSubcategoryId(null); }}
            >
              <VintageText variant="mono" size="xs" color={!categoryId ? Theme.colors.paper : Theme.colors.ink}>
                NONE
              </VintageText>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => { setCategoryId(cat.id); setSubcategoryId(null); }}
              >
                <VintageText variant="mono" size="xs" color={categoryId === cat.id ? Theme.colors.paper : cat.color}>
                  {cat.icon} {cat.name.toUpperCase()}
                </VintageText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategory picker (shown only when a category is selected and has subs) */}
          {availableSubs.length > 0 ? (
            <>
              <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
                SUBCATEGORY
              </VintageText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                <TouchableOpacity
                  style={[styles.catChip, !subcategoryId && styles.catChipActive]}
                  onPress={() => setSubcategoryId(null)}
                >
                  <VintageText variant="mono" size="xs" color={!subcategoryId ? Theme.colors.paper : Theme.colors.ink}>
                    NONE
                  </VintageText>
                </TouchableOpacity>
                {availableSubs.map(sub => {
                  const color = sub.color ?? categories.find(c => c.id === sub.category_id)?.color ?? Theme.colors.muted;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.catChip, subcategoryId === sub.id && { backgroundColor: color, borderColor: color }]}
                      onPress={() => setSubcategoryId(sub.id)}
                    >
                      <VintageText variant="mono" size="xs" color={subcategoryId === sub.id ? Theme.colors.paper : color}>
                        ◈ {sub.name.toUpperCase()}
                      </VintageText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

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

          {repeat === 'custom' ? (
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
          ) : null}

          <ReminderEditor value={reminder} onChange={setReminder} title="SET REMINDER" />
        </>
      ) : (
        <>
          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.pickerLabel}>
            JOURNAL YOUR PLAN
          </VintageText>
          <VintageInput
            value={aiPrompt}
            onChangeText={(text) => {
              setAiPrompt(text);
              setAiFeedback('');
            }}
            placeholder="Describe your tasks... e.g. morning run at 6am, read for 20 mins, take vitamins"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.aiInput}
          />
          {aiFeedback ? (
            <VintageText
              variant="mono"
              size="xs"
              color={aiFeedbackError ? Theme.colors.red : Theme.colors.green}
              style={styles.aiFeedback}
            >
              {aiFeedback}
            </VintageText>
          ) : null}
        </>
      )}

      <Divider marginVertical={Theme.spacing.sm} />
      <View style={styles.actions}>
        <VintageButton label="CANCEL" variant="ghost" onPress={onClose} size="sm" />
        <View style={[styles.inlineSavingWrap, saving && styles.inlineSavingWrapVisible]}>
          {saving ? <ActivityIndicator size="small" color={Theme.colors.goldDark} /> : null}
        </View>
        <VintageButton
          label={saving ? (mode === 'ai' ? 'THINKING...' : 'SAVING...') : mode === 'ai' ? 'CREATE WITH AI' : 'SAVE TASK'}
          onPress={mode === 'ai' ? handleAiCreate : handleSave}
          disabled={saving}
          size="sm"
        />
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
  modeSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paperDark,
    marginBottom: Theme.spacing.sm,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xs,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.borderLight,
  },
  modeTabActive: {
    backgroundColor: Theme.colors.ink,
  },
  pickerLabel: {
    letterSpacing: 1,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  errorText: {
    marginTop: -4,
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
    alignItems: 'center',
  },
  aiInput: {
    minHeight: 120,
    lineHeight: 20,
  },
  aiFeedback: {
    marginTop: -4,
    marginBottom: 4,
  },
  inlineSavingWrap: {
    width: 0,
    opacity: 0,
  },
  inlineSavingWrapVisible: {
    width: 24,
    opacity: 1,
  },
});
