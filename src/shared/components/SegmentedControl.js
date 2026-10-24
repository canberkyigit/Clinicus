import React from 'react';
import { Pressable, View } from 'react-native';
import { useStyles } from '../theme/ThemeProvider';
import { useHaptics } from '../hooks/useHaptics';
import AppText from './AppText';

// options: { value, label, badge? }[]
export default function SegmentedControl({ options, value, onChange, style }) {
  const styles = useStyles(makeStyles);
  const haptics = useHaptics();
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(o.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.active]}
          >
            <AppText variant="smallMedium" color={active ? 'primary' : 'secondary'} numberOfLines={1}>
              {o.label}
            </AppText>
            {o.badge ? (
              <View style={styles.badge}>
                <AppText variant="caption" color="#fff" style={styles.badgeText}>
                  {o.badge}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = t => ({
  track: {
    flexDirection: 'row',
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: t.radius.md - 3,
  },
  active: { backgroundColor: t.colors.surface, ...t.shadow },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: t.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, lineHeight: 11 },
});
