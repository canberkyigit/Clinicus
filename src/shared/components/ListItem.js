import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

// Generic row: leading (avatar/icon), title + subtitle, trailing content.
export default function ListItem({
  title,
  subtitle,
  meta,
  leading,
  icon,
  iconTone = 'success',
  trailing,
  chevron = false,
  onPress,
  onLongPress,
  divider = true,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {leading}
      {!leading && icon ? (
        <View style={[styles.icon, { backgroundColor: colors[`${iconTone}Muted`] }]}>
          <Feather name={icon} size={18} color={colors[iconTone]} />
        </View>
      ) : null}
      <View style={[styles.body, divider && styles.divider]}>
        <View style={styles.text}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" color="secondary" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {meta ? (
            <AppText variant="caption" color="tertiary" numberOfLines={1} style={styles.meta}>
              {meta}
            </AppText>
          ) : null}
        </View>
        {trailing}
        {chevron ? <Feather name="chevron-right" size={18} color={colors.textTertiary} /> : null}
      </View>
    </Pressable>
  );
}

const makeStyles = t => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  pressed: { opacity: 0.6 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  text: { flex: 1, gap: 1 },
  meta: { marginTop: 2 },
});
