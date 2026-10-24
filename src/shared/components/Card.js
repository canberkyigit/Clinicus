import React from 'react';
import { Pressable } from 'react-native';
import { useStyles } from '../theme/ThemeProvider';
import SectionHeader from './SectionHeader';

export default function Card({ title, actionLabel, onAction, right, onPress, padded = true, style, children }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.card, padded && styles.padded, pressed && styles.pressed, style]}
    >
      {title ? (
        <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} right={right} inset={false} />
      ) : null}
      {children}
    </Pressable>
  );
}

const makeStyles = t => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    marginBottom: 14,
  },
  padded: { padding: 16 },
  pressed: { backgroundColor: t.colors.surfacePressed },
});
