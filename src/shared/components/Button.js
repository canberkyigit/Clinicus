import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import { useHaptics } from '../hooks/useHaptics';
import AppText from './AppText';

// variant: primary | secondary | outline | ghost | danger | dangerSoft
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const haptics = useHaptics();

  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.surfaceAlt },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
    dangerSoft: { bg: colors.dangerMuted, fg: colors.danger, border: 'transparent' },
  }[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={e => {
        haptics.light();
        onPress?.(e);
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Feather name={icon} size={size === 'sm' ? 15 : 18} color={palette.fg} /> : null}
          {title ? (
            <AppText variant={size === 'sm' ? 'smallMedium' : 'bodyMedium'} color={palette.fg} numberOfLines={1}>
              {title}
            </AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = t => ({
  base: {
    minHeight: 50,
    borderRadius: t.radius.md + 2,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { minHeight: 36, paddingHorizontal: 12, borderRadius: t.radius.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
