/**
 * Theme store for dark mode
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Get system preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      // Initialize effective theme
      const systemTheme = getSystemTheme();
      const initialTheme = (localStorage.getItem('generative-score-lab-theme') as Theme) || 'system';
      const effectiveTheme = initialTheme === 'system' ? systemTheme : initialTheme;
      
      // Apply theme immediately
      applyTheme(effectiveTheme);
      
      // Listen for system theme changes
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          const { theme } = get();
          if (theme === 'system') {
            const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light';
            set({ effectiveTheme: newEffectiveTheme });
            applyTheme(newEffectiveTheme);
          }
        };
        mediaQuery.addEventListener('change', handleChange);
      }

      return {
        theme: initialTheme,
        effectiveTheme,
        setTheme: (theme: Theme) => {
          const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
          set({ theme, effectiveTheme });
          applyTheme(effectiveTheme);
        },
        toggleTheme: () => {
          const { theme } = get();
          const newTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
          const effectiveTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
          set({ theme: newTheme, effectiveTheme });
          applyTheme(effectiveTheme);
        },
      };
    },
    {
      name: 'generative-score-lab-theme',
    }
  )
);

