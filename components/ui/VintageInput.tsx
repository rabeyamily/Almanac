import React from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from './VintageText';

interface VintageInputProps extends Omit<TextInputProps, 'children'> {
  label?: string;
  error?: string;
}

export function VintageInput({ label, error, style, ...props }: VintageInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.inkFaint} style={styles.label}>
          {label.toUpperCase()}
        </VintageText>
      ) : null}

      <View style={[styles.inputShell, error ? styles.inputError : null]}>
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={Theme.colors.inkFaint}
          selectionColor={Theme.colors.gold}
          {...props}
        />
      </View>

      {error ? (
        <VintageText variant="mono" size="xs" color={Theme.colors.red} style={styles.error}>
          {error}
        </VintageText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Theme.spacing.sm,
  },
  label: {
    marginBottom: 4,
    letterSpacing: 1,
  },
  inputShell: {
    borderWidth: Theme.borderWidth.normal,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.paper,
  },
  input: {
    fontFamily: Theme.fonts.mono,
    fontSize: Theme.fontSize.monoMd,
    color: Theme.colors.ink,
    borderRadius: Theme.borderRadius.none,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    includeFontPadding: false,
  },
  inputError: {
    borderColor: Theme.colors.red,
  },
  error: {
    marginTop: 4,
  },
});
