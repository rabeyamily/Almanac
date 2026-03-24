import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Theme } from '@/constants/theme';
import { ReminderFrequency, ReminderSettings } from '@/lib/types';
import { VintageText } from '@/components/ui';
import { requestNotificationPermission } from '@/lib/notifications';

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const EMPTY_REMINDER: ReminderSettings = {
  enabled: false,
  frequency: 'daily',
  date: null,
  time: '09:00',
  custom_days: null,
  message: null,
  notification_ids: null,
};

interface ReminderEditorProps {
  title?: string;
  value: ReminderSettings | null;
  onChange: (next: ReminderSettings | null) => void;
}

function reminderOrDefault(value: ReminderSettings | null): ReminderSettings {
  return value ? { ...EMPTY_REMINDER, ...value } : { ...EMPTY_REMINDER };
}

export function ReminderEditor({ title = 'SET REMINDER', value, onChange }: ReminderEditorProps) {
  const [open, setOpen] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const reminder = useMemo(() => reminderOrDefault(value), [value]);

  const setReminder = (patch: Partial<ReminderSettings>) => {
    onChange({ ...reminder, ...patch });
  };

  const setEnabled = async (enabled: boolean) => {
    if (enabled) {
      setShowPermissionPrompt(true);
      return;
    }
    setReminder({ enabled: false, notification_ids: null });
  };

  const ensurePermissionAndEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) setReminder({ enabled: true });
    setShowPermissionPrompt(false);
  };

  const toggleCustomDay = (d: number) => {
    const current = reminder.custom_days ?? [];
    const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
    setReminder({ custom_days: next });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen(p => !p)} activeOpacity={0.7}>
        <VintageText variant="pixel" size="xs" color={Theme.colors.muted} style={styles.headerText}>
          {title}
        </VintageText>
        <VintageText variant="mono" size="sm" color={Theme.colors.muted}>
          {open ? '▼' : '▶'}
        </VintageText>
      </TouchableOpacity>

      {open ? (
        <View style={styles.body}>
          <View style={styles.rowBetween}>
            <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint}>
              ENABLED
            </VintageText>
            <TouchableOpacity
              onPress={() => setEnabled(!reminder.enabled)}
              style={[styles.toggle, reminder.enabled && styles.toggleOn]}
            >
              <VintageText variant="mono" size="xs" color={reminder.enabled ? Theme.colors.paper : Theme.colors.ink}>
                {reminder.enabled ? 'ON' : 'OFF'}
              </VintageText>
            </TouchableOpacity>
          </View>

          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>SCHEDULE</VintageText>
          <View style={styles.rowWrap}>
            {(['once', 'daily', 'weekdays', 'custom'] as ReminderFrequency[]).map(freq => (
              <TouchableOpacity
                key={freq}
                style={[styles.chip, reminder.frequency === freq && styles.chipActive]}
                onPress={() => setReminder({ frequency: freq })}
              >
                <VintageText variant="mono" size="xs" color={reminder.frequency === freq ? Theme.colors.paper : Theme.colors.ink}>
                  {freq.toUpperCase()}
                </VintageText>
              </TouchableOpacity>
            ))}
          </View>

          {reminder.frequency === 'once' ? (
            <>
              <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>DATE (YYYY-MM-DD)</VintageText>
              <TextInput
                value={reminder.date ?? ''}
                onChangeText={t => setReminder({ date: t || null })}
                style={styles.input}
                placeholder="2026-03-24"
                placeholderTextColor={Theme.colors.inkFaint}
              />
            </>
          ) : null}

          {reminder.frequency === 'custom' ? (
            <>
              <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>CUSTOM DAYS</VintageText>
              <View style={styles.rowWrap}>
                {DAY_LABELS.map((d, i) => {
                  const active = reminder.custom_days?.includes(i) ?? false;
                  return (
                    <TouchableOpacity key={d} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => toggleCustomDay(i)}>
                      <VintageText variant="mono" size="xs" color={active ? Theme.colors.paper : Theme.colors.ink}>{d}</VintageText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>TIME (HH:MM)</VintageText>
          <TextInput
            value={reminder.time ?? ''}
            onChangeText={t => setReminder({ time: t || null })}
            style={styles.input}
            placeholder="09:00"
            placeholderTextColor={Theme.colors.inkFaint}
          />

          <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>MESSAGE (OPTIONAL)</VintageText>
          <TextInput
            value={reminder.message ?? ''}
            onChangeText={t => setReminder({ message: t || null })}
            style={styles.input}
            placeholder="Leave blank to use name"
            placeholderTextColor={Theme.colors.inkFaint}
          />
        </View>
      ) : null}

      {showPermissionPrompt ? (
        <View style={styles.permissionOverlay}>
          <VintageText variant="pixel" size="xs" color={Theme.colors.ink} style={styles.permissionTitle}>
            ALLOW NOTIFICATIONS?
          </VintageText>
          <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.permissionBody}>
            Almanac needs permission to schedule reminders.
          </VintageText>
          <View style={styles.permissionActions}>
            <TouchableOpacity style={styles.permissionBtn} onPress={ensurePermissionAndEnable}>
              <VintageText variant="mono" size="xs" color={Theme.colors.paper}>ALLOW</VintageText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.permissionBtn, styles.permissionBtnGhost]} onPress={() => setShowPermissionPrompt(false)}>
              <VintageText variant="mono" size="xs" color={Theme.colors.ink}>NOT NOW</VintageText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.paper,
    marginTop: Theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    borderStyle: 'dotted',
  },
  headerText: {
    letterSpacing: 1,
  },
  body: {
    padding: Theme.spacing.sm,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Theme.colors.paper,
  },
  toggleOn: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
  },
  label: {
    marginTop: 2,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Theme.colors.paper,
  },
  chipActive: {
    backgroundColor: Theme.colors.ink,
    borderColor: Theme.colors.ink,
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
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoSm,
    color: Theme.colors.ink,
  },
  permissionOverlay: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.sm,
  },
  permissionTitle: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  permissionBody: {
    marginBottom: Theme.spacing.sm,
  },
  permissionActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  permissionBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.ink,
    backgroundColor: Theme.colors.ink,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  permissionBtnGhost: {
    backgroundColor: Theme.colors.paper,
  },
});
