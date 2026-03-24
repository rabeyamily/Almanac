import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';
import { Theme } from '@/constants/theme';
import { VintageText } from './VintageText';

interface VintageButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: {
    bg: Theme.colors.ink,
    border: Theme.colors.ink,
    text: Theme.colors.paper,
  },
  secondary: {
    bg: Theme.colors.paper,
    border: Theme.colors.border,
    text: Theme.colors.ink,
  },
  danger: {
    bg: Theme.colors.red,
    border: Theme.colors.redDark,
    text: Theme.colors.paper,
  },
  ghost: {
    bg: 'transparent',
    border: Theme.colors.border,
    text: Theme.colors.ink,
  },
};

export function VintageButton({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  disabled,
  ...props
}: VintageButtonProps) {
  const vs = variantStyles[variant];
  const padding = size === 'sm' ? Theme.spacing.sm : size === 'lg' ? Theme.spacing.lg : Theme.spacing.md;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? Theme.colors.muted : vs.bg,
          borderColor: disabled ? Theme.colors.muted : vs.border,
          paddingVertical: padding * 0.6,
          paddingHorizontal: padding,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {/* Mechanical button shadow effect */}
      <View style={[styles.shadow, { backgroundColor: disabled ? Theme.colors.inkFaint : vs.border }]} />
      <VintageText
        variant="pixel"
        size={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'}
        color={disabled ? Theme.colors.paper : vs.text}
        align="center"
      >
        {label}
      </VintageText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: Theme.borderWidth.normal,
    borderRadius: Theme.borderRadius.none,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    left: 3,
    top: 3,
    zIndex: -1,
  },
});
