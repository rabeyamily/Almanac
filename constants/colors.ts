export const Colors = {
  // Base palette
  paper: '#F5E6C8',
  paperDark: '#EDD9A3',
  paperDeep: '#D4B896',
  ink: '#1C1C1C',
  inkLight: '#3A3A3A',
  inkFaint: '#6B6B6B',

  // Accent colors
  green: '#4A7C59',
  greenLight: '#6BA07A',
  greenDark: '#2E5C3A',
  red: '#C0392B',
  redLight: '#E05C50',
  redDark: '#8B2519',
  gold: '#C9A84C',
  goldLight: '#E8C96C',
  goldDark: '#9A7A2E',

  // UI states
  border: '#8B7355',
  borderLight: '#C4A882',
  background: '#F5E6C8',
  surface: '#EDD9A3',
  overlay: 'rgba(28, 28, 28, 0.6)',

  // Semantic
  success: '#4A7C59',
  error: '#C0392B',
  warning: '#C9A84C',
  muted: '#8B7355',

  // Category colors (vintage palette subset)
  categoryColors: [
    '#4A7C59', // muted green
    '#C0392B', // faded red
    '#C9A84C', // brass gold
    '#6B4C3B', // dark brown
    '#5A6E8C', // slate blue
    '#8B5A8B', // muted purple
    '#7A6E4A', // olive
    '#3A6B6B', // teal
  ],
} as const;
