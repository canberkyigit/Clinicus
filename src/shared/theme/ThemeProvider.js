import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { buildTheme } from './theme';

const ThemeContext = createContext(buildTheme(true));

// mode: 'system' | 'light' | 'dark'
export function ThemeProvider({ mode = 'system', children }) {
  const scheme = useColorScheme();
  const isDark = mode === 'system' ? scheme !== 'light' : mode === 'dark';
  const theme = useMemo(() => buildTheme(isDark), [isDark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Usage: const makeStyles = t => ({ ... }); const styles = useStyles(makeStyles);
// Styles are rebuilt only when the theme changes.
export function useStyles(factory) {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}
