import React from 'react';
import { View } from 'react-native';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

// Soft "pill" badge. tone: success | warning | danger | info | purple | neutral
export default function Badge({ label, tone = 'neutral', dot = false, style }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.badge, { backgroundColor: colors[`${tone}Muted`] || colors.neutralMuted }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: colors[tone] }]} /> : null}
      <AppText variant="caption" color={colors[tone] || colors.neutral} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = t => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: t.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
