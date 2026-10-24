import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';
import Button from './Button';

export default function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction, compact = false }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={compact ? 20 : 26} color={colors.textTertiary} />
      </View>
      <AppText variant="bodyMedium" color="secondary" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" color="tertiary" align="center">
          {message}
        </AppText>
      ) : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" style={styles.action} /> : null}
    </View>
  );
}

const makeStyles = t => ({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 6 },
  compact: { paddingVertical: 20 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  action: { marginTop: 10 },
});
