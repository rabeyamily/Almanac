import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface VintageTextProps extends TextProps {
  variant?: 'pixel' | 'mono';
  size?: keyof typeof pixelSizes | keyof typeof monoSizes;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const pixelSizes = {
  xs: Theme.fontSize.pixelXs,
  sm: Theme.fontSize.pixelSm,
  md: Theme.fontSize.pixelMd,
  lg: Theme.fontSize.pixelLg,
  xl: Theme.fontSize.pixelXl,
};

const monoSizes = {
  xs: Theme.fontSize.monoXs,
  sm: Theme.fontSize.monoSm,
  md: Theme.fontSize.monoMd,
  lg: Theme.fontSize.monoLg,
  xl: Theme.fontSize.monoXl,
  xxl: Theme.fontSize.monoXxl,
};

export function VintageText({
  variant = 'mono',
  size = 'md',
  color = Theme.colors.ink,
  align = 'left',
  style,
  ...props
}: VintageTextProps) {
  const fontSize =
    variant === 'pixel'
      ? (pixelSizes as Record<string, number>)[size] ?? Theme.fontSize.pixelMd
      : (monoSizes as Record<string, number>)[size] ?? Theme.fontSize.monoMd;

  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily: variant === 'pixel' ? Theme.fonts.pixel : Theme.fonts.mono,
          fontSize,
          color,
          textAlign: align,
          lineHeight: fontSize * (variant === 'pixel' ? 1.8 : 1.5),
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
