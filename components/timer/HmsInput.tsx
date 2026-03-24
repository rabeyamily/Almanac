import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from '@/components/ui';

interface HmsInputProps {
  hours: string;
  minutes: string;
  seconds: string;
  onChangeHours: (v: string) => void;
  onChangeMinutes: (v: string) => void;
  onChangeSeconds: (v: string) => void;
  label?: string;
  compact?: boolean;
}

function sanitize(v: string, max: number): string {
  const n = v.replace(/[^\d]/g, '').slice(0, 2);
  if (!n) return '';
  return String(Math.min(max, Number(n))).padStart(2, '0');
}

export function hmsToSeconds(h: string, m: string, s: string): number {
  const hh = Number(h || '0');
  const mm = Number(m || '0');
  const ss = Number(s || '0');
  return Math.max(0, hh * 3600 + mm * 60 + ss);
}

export function secondsToHms(total: number): { h: string; m: string; s: string } {
  const safe = Math.max(0, total);
  const h = Math.floor(safe / 3600).toString().padStart(2, '0');
  const m = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return { h, m, s };
}

export function HmsInput({
  hours,
  minutes,
  seconds,
  onChangeHours,
  onChangeMinutes,
  onChangeSeconds,
  label,
  compact = false,
}: HmsInputProps) {
  const inputStyle = compact ? [styles.field, styles.fieldCompact] : styles.field;
  return (
    <View style={styles.wrap}>
      {label ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>
          {label.toUpperCase()}
        </VintageText>
      ) : null}
      <View style={styles.row}>
        <Field value={hours} onChangeText={t => onChangeHours(sanitize(t, 99))} style={inputStyle} />
        <VintageText variant="pixel" size="xs" color={Theme.colors.muted}>:</VintageText>
        <Field value={minutes} onChangeText={t => onChangeMinutes(sanitize(t, 59))} style={inputStyle} />
        <VintageText variant="pixel" size="xs" color={Theme.colors.muted}>:</VintageText>
        <Field value={seconds} onChangeText={t => onChangeSeconds(sanitize(t, 59))} style={inputStyle} />
      </View>
    </View>
  );
}

function Field(props: TextInputProps) {
  return (
    <TextInput
      keyboardType="number-pad"
      maxLength={2}
      placeholder="00"
      placeholderTextColor={Theme.colors.inkFaint}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Theme.spacing.sm,
  },
  label: {
    marginBottom: 4,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  field: {
    width: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    textAlign: 'center',
  },
  fieldCompact: {
    width: 50,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 4,
  },
});
