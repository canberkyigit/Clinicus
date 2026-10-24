import React from 'react';
import { Pressable, View } from 'react-native';
import { useStyles } from '../theme/ThemeProvider';
import AppText from './AppText';

export default function SectionHeader({ title, actionLabel, onAction, right, inset = false, style }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.row, inset && styles.inset, style]}>
      <AppText variant="h3" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {right}
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText variant="smallMedium" color="brand">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = () => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  inset: { marginTop: 10 },
  title: { flexShrink: 1 },
});
