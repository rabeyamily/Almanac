// Font family names after loading via expo-google-fonts
export const Fonts = {
  // Pixelated retro — used for headlines, titles, clock
  pixel: 'PressStart2P_400Regular',

  // Monospace terminal — used for body, labels, inputs
  mono: 'ShareTechMono_400Regular',
} as const;

export type FontFamily = (typeof Fonts)[keyof typeof Fonts];
