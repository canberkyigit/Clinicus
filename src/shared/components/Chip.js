import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import { useHaptics } from '../hooks/useHaptics';
import AppText from './AppText';

export function Chip({ label, selected, onPress, tone = 'success', count, icon }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const fg = selected ? colors[tone] : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: colors[`${tone}Muted`], borderColor: colors[tone] },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={fg} /> : null}
      <AppText variant="smallMedium" color={fg}>
        {label}
      </AppText>
      {count !== undefined ? (
        <View style={[styles.count, selected && { backgroundColor: colors[tone] }]}>
          <AppText variant="caption" color={selected ? colors.onPrimary : colors.textSecondary}>
            {count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

// options: string[] or { value, label, count?, tone?, icon? }[]
export default function ChipGroup({ options, value, onChange, scroll = false, inset = false, style }) {
  const styles = useStyles(makeStyles);
  const haptics = useHaptics();
  const items = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const chips = items.map(item => (
    <Chip
      key={String(item.value)}
      label={item.label}
      count={item.count}
      tone={item.tone}
      icon={item.icon}
      selected={item.value === value}
      onPress={() => {
        haptics.selection();
        onChange(item.value);
      }}
    />
  ));

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // flexShrink: 0 stops a sibling list from squeezing and clipping the row.
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.scrollRow, inset && styles.inset]}
        keyboardShouldPersistTaps="handled"
      >
        {chips}
      </ScrollView>
    );
  }
  return <View style={[styles.wrapRow, style]}>{chips}</View>;
}

const makeStyles = t => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  pressed: { opacity: 0.7 },
  count: {
    minWidth: 20,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceAlt,
  },
  scroll: { flexGrow: 0, flexShrink: 0 },
  scrollRow: { gap: 8 },
  inset: { paddingHorizontal: t.spacing.screen },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
