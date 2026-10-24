import React from 'react';
import { View } from 'react-native';
import { useStyles } from '../theme/ThemeProvider';
import AppText from './AppText';
import IconButton from './IconButton';

// `large` = tab-root style (big left-aligned title); otherwise a compact
// centered title with a back button.
export default function ScreenHeader({ title, subtitle, onBack, right, large = false }) {
  const styles = useStyles(makeStyles);

  if (large) {
    return (
      <View style={styles.large}>
        <View style={styles.flex}>
          {subtitle ? (
            <AppText variant="smallMedium" color="secondary">
              {subtitle}
            </AppText>
          ) : null}
          <AppText variant="display" accessibilityRole="header" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.compact}>
      <View style={styles.side}>
        {onBack ? <IconButton icon="chevron-left" onPress={onBack} accessibilityLabel="Geri" size={24} /> : null}
      </View>
      <View style={styles.center}>
        <AppText variant="h3" numberOfLines={1} accessibilityRole="header" align="center">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary" numberOfLines={1} align="center">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  large: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: t.spacing.screen,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  actions: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 52,
  },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: 4 },
  center: { flex: 1, alignItems: 'center' },
});
