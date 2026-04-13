import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Global store for theme management
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light', 
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
}));

/**
 * Returns the current active theme from the global store.
 */
export const useColorScheme = () => {
  const theme = useThemeStore((state) => state.theme);
  return theme;
};
