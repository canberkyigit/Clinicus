// Design tokens. Components never hard-code colors: they read them from
// `useTheme()` so light and dark mode stay consistent.

export const darkColors = {
  background: '#0B1210',
  surface: '#121B17',
  surfaceAlt: '#19241F',
  surfacePressed: '#1F2C26',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  overlay: 'rgba(0,0,0,0.6)',
  text: '#F1F5F3',
  textSecondary: '#A3AFA9',
  textTertiary: '#6E7A74',
  primary: '#3DDC97',
  primaryMuted: 'rgba(61,220,151,0.14)',
  onPrimary: '#05251A',
  success: '#3DDC97',
  successMuted: 'rgba(61,220,151,0.14)',
  danger: '#FF6B6B',
  dangerMuted: 'rgba(255,107,107,0.14)',
  warning: '#FFB547',
  warningMuted: 'rgba(255,181,71,0.14)',
  info: '#5AB0FF',
  infoMuted: 'rgba(90,176,255,0.14)',
  purple: '#A78BFA',
  purpleMuted: 'rgba(167,139,250,0.16)',
  neutral: '#A3AFA9',
  neutralMuted: 'rgba(163,175,169,0.14)',
  chart: ['#3DDC97', '#5AB0FF', '#FFB547', '#A78BFA', '#FF6B6B', '#2DD4BF', '#F472B6'],
};

export const lightColors = {
  background: '#F3F6F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F1',
  surfacePressed: '#E5ECE9',
  border: 'rgba(15,30,24,0.08)',
  borderStrong: 'rgba(15,30,24,0.16)',
  overlay: 'rgba(8,16,12,0.45)',
  text: '#0E1A15',
  textSecondary: '#55645D',
  textTertiary: '#8B9892',
  primary: '#0E9F6E',
  primaryMuted: 'rgba(14,159,110,0.10)',
  onPrimary: '#FFFFFF',
  success: '#0E9F6E',
  successMuted: 'rgba(14,159,110,0.10)',
  danger: '#E5484D',
  dangerMuted: 'rgba(229,72,77,0.10)',
  warning: '#D97706',
  warningMuted: 'rgba(217,119,6,0.12)',
  info: '#2F80ED',
  infoMuted: 'rgba(47,128,237,0.10)',
  purple: '#7C5CFA',
  purpleMuted: 'rgba(124,92,250,0.10)',
  neutral: '#55645D',
  neutralMuted: 'rgba(85,100,93,0.10)',
  chart: ['#0E9F6E', '#2F80ED', '#D97706', '#7C5CFA', '#E5484D', '#0D9488', '#DB2777'],
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  numeric: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 20,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export function buildTheme(isDark) {
  const colors = isDark ? darkColors : lightColors;
  return {
    isDark,
    colors,
    fonts,
    typography,
    spacing,
    radius,
    shadow: isDark
      ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }
      : { shadowColor: '#0E1A15', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  };
}
