import { Colors } from './colors';
import { Fonts } from './fonts';

export const Theme = {
  colors: Colors,
  fonts: Fonts,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  fontSize: {
    // Pixel font sizes (PressStart2P renders small — scale down)
    pixelXs: 7,
    pixelSm: 9,
    pixelMd: 11,
    pixelLg: 14,
    pixelXl: 18,

    // Mono font sizes
    monoXs: 11,
    monoSm: 13,
    monoMd: 15,
    monoLg: 18,
    monoXl: 22,
    monoXxl: 28,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  borderWidth: {
    thin: 1,
    normal: 2,
    thick: 3,
  },

  borderRadius: {
    // Keep corners sharp for vintage feel
    none: 0,
    xs: 2,
    sm: 4,
  },
} as const;

export type ThemeType = typeof Theme;
