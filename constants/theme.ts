export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    tint: '#FF69B4', // Light Pink
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#FF69B4',
    surface: '#f8f9fa',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    textMuted: '#64748b',
  },
  dark: {
    text: '#ffffff',
    background: '#121212', // Material Dark
    tint: '#FF69B4', // Light Pink
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FF69B4',
    surface: '#1e1e1e',
    glass: 'rgba(0, 0, 0, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textMuted: '#94a3b8',
  },
};

export const Theme = {
  colors: {
    primary: '#FF69B4', // Hot Pink
    secondary: '#FFB6C1', // Light Pink
    accent: '#FFC0CB', // Baby Pink
    // Default to light, but components should use useColorScheme hook
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#000000',
    textMuted: '#64748b',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    success: '#10b981',
    error: '#ef4444',
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
    xl: 30,
    full: 9999,
  }
};
