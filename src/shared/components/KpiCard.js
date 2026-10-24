import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import { formatPercent } from '../utils/format';
import AppText from './AppText';
import Sparkline from './charts/Sparkline';

// Metric tile: icon, label, big value, optional delta vs. previous period and sparkline.
export default function KpiCard({ icon, tone = 'success', label, value, delta, deltaInverse = false, caption, spark, onPress, style }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const positive = deltaInverse ? delta <= 0 : delta >= 0;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors[`${tone}Muted`] }]}>
          <Feather name={icon} size={16} color={colors[tone]} />
        </View>
        {delta !== undefined && delta !== null ? (
          <View style={[styles.delta, { backgroundColor: positive ? colors.successMuted : colors.dangerMuted }]}>
            <Feather name={delta >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={positive ? colors.success : colors.danger} />
            <AppText variant="caption" color={positive ? 'success' : 'danger'}>
              {formatPercent(delta)}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="small" color="secondary" numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
      <AppText variant="numeric" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {caption ? (
        <AppText variant="caption" color="tertiary" numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}
      {spark ? <Sparkline data={spark} color={colors[tone]} style={styles.spark} /> : null}
    </Pressable>
  );
}

const makeStyles = t => ({
  card: {
    flex: 1,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 14,
    minHeight: 128,
  },
  pressed: { backgroundColor: t.colors.surfacePressed },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: t.radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  label: { marginBottom: 2 },
  spark: { marginTop: 8 },
});
