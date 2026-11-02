import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeMode } from '@/domain';

import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  readonly mode: ThemeMode;
  /** Thème effectivement appliqué (« système » résolu). */
  readonly scheme: ColorScheme;
  readonly colors: ThemeColors;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ mode, children }: { readonly mode: ThemeMode; readonly children: ReactNode }) {
  const system = useColorScheme();
  const theme = useMemo<Theme>(() => {
    const scheme: ColorScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
    return { mode, scheme, colors: scheme === 'dark' ? darkColors : lightColors };
  }, [mode, system]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme() doit être appelé sous <ThemeProvider>.');
  return theme;
}
