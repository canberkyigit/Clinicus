import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const COLOR_KEYS = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  brand: 'primary',
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
  onPrimary: 'onPrimary',
};

// variant: key of theme.typography; color: semantic key above or a raw color.
export default function AppText({ variant = 'body', color = 'primary', align, style, children, ...props }) {
  const { typography, colors } = useTheme();
  const resolved = colors[COLOR_KEYS[color]] || colors[color] || color;
  return (
    <Text
      {...props}
      style={[typography[variant], { color: resolved }, align && { textAlign: align }, style]}
      maxFontSizeMultiplier={1.4}
    >
      {children}
    </Text>
  );
}
