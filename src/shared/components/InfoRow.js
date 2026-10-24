import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

export default function InfoRow({ icon, label, value, onPress, last = false, valueColor }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
    >
      {icon ? <Feather name={icon} size={16} color={colors.textTertiary} /> : null}
      <AppText variant="small" color="secondary" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="smallMedium" color={valueColor || (onPress ? 'brand' : 'primary')} style={styles.value}>
        {value === undefined || value === null || value === '' ? '—' : value}
      </AppText>
    </Pressable>
  );
}

export function InfoGroup({ children }) {
  return <View>{children}</View>;
}

const makeStyles = t => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  pressed: { opacity: 0.6 },
  label: { width: 110 },
  value: { flex: 1, textAlign: 'right' },
});
