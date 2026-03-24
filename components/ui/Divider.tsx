import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from './VintageText';

interface DividerProps {
  label?: string;
  marginVertical?: number;
}

export function Divider({ label, marginVertical = Theme.spacing.md }: DividerProps) {
  if (label) {
    return (
      <View style={[styles.row, { marginVertical }]}>
        <View style={styles.line} />
        <VintageText variant="mono" size="xs" color={Theme.colors.muted} style={styles.label}>
          {label}
        </VintageText>
        <View style={styles.line} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.solid,
        { marginVertical, borderColor: Theme.colors.borderLight },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  solid: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  line: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Theme.colors.borderLight,
  },
  label: {
    letterSpacing: 2,
  },
});
