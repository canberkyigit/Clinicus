import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

// variant: 'plain' (transparent) | 'tinted' (soft surface) | 'primary'
export default function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  variant = 'plain',
  color,
  badge,
  disabled,
  style,
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const fg = color || (variant === 'primary' ? colors.onPrimary : colors.text);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === 'tinted' && styles.tinted,
        variant === 'primary' && styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Feather name={icon} size={size} color={fg} />
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="caption" color="#fff" style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = t => ({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tinted: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  primary: { backgroundColor: t.colors.primary },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: t.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.colors.background,
  },
  badgeText: { fontSize: 9, lineHeight: 11 },
});
