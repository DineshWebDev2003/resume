export const C = {
  bg: '#FFF3E9',
  surface: '#FFFFFF',
  text: '#573353',
  muted: 'rgba(87, 51, 83, 0.55)',
  faint: 'rgba(87, 51, 83, 0.08)',
  primary: '#FDA758',
  primaryDeep: '#FC9D45',
  inputBg: '#FFF6ED',
  tileOff: '#C8C1C8',
  danger: '#F65B4E',
  blue: '#29319F',
  white: '#FFFFFF',
  black: '#000000',
  gradientTop: '#FBEADB',
} as const;

export const TRACKING = { letterSpacing: -0.3 };

export const Colors = {
  light: {
    text: C.text,
    background: C.bg,
    tint: C.primary,
    icon: '#8C6E89',
    tabIconDefault: 'rgba(87, 51, 83, 0.4)',
    tabIconSelected: C.primary,
    surface: C.surface,
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: C.faint,
    textMuted: C.muted,
  },
  dark: {
    text: C.text,
    background: C.bg,
    tint: C.primary,
    icon: '#8C6E89',
    tabIconDefault: 'rgba(87, 51, 83, 0.4)',
    tabIconSelected: C.primary,
    surface: C.surface,
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: C.faint,
    textMuted: C.muted,
  },
};

export const Theme = {
  colors: {
    primary: C.primary,
    primaryDeep: C.primaryDeep,
    secondary: C.inputBg,
    accent: C.blue,
    background: C.bg,
    surface: C.surface,
    text: C.text,
    textMuted: C.muted,
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: C.faint,
    success: '#22c55e',
    error: C.danger,
    coral: C.danger,
    cyan: C.blue,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  border: {
    width: 1,
    color: C.faint,
  },
  shadow: {
    shadowColor: C.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
};
