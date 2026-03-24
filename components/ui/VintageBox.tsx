import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface VintageBoxProps extends ViewProps {
  /** 'single' = one border line, 'double' = double-line box frame */
  borderStyle?: 'single' | 'double' | 'dotted' | 'none';
  padding?: number;
  backgroundColor?: string;
  borderColor?: string;
}

export function VintageBox({
  borderStyle = 'single',
  padding = Theme.spacing.md,
  backgroundColor = Theme.colors.paper,
  borderColor = Theme.colors.border,
  style,
  children,
  ...props
}: VintageBoxProps) {
  return (
    <View
      style={[
        styles.base,
        {
          padding,
          backgroundColor,
          borderColor,
          borderStyle: borderStyle === 'dotted' ? 'dotted' : 'solid',
          borderWidth: borderStyle === 'none' ? 0 : Theme.borderWidth.normal,
        },
        // Double border is simulated with an inner view
        borderStyle === 'double' && styles.doubleOuter,
        style,
      ]}
      {...props}
    >
      {borderStyle === 'double' ? (
        <View style={[styles.doubleInner, { borderColor, padding: padding * 0.5 }]}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.none,
  },
  doubleOuter: {
    borderWidth: Theme.borderWidth.normal,
  },
  doubleInner: {
    borderWidth: Theme.borderWidth.thin,
    borderStyle: 'solid',
  },
});
