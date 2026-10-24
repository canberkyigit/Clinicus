import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Badge from '../../../shared/components/Badge';
import { useMoney } from '../../../shared/context/AppDataContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { relativeDay } from '../../../shared/utils/date';

export default function TransactionRow({ transaction: t, onPress, divider = true }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { format } = useMoney();
  const income = t.type === 'income';
  const tone = income ? 'success' : 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${income ? 'Gelir' : 'Gider'}, ${t.description}, ${format(t.amount)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: colors[`${tone}Muted`] }]}>
        <Feather name={income ? 'arrow-down-left' : 'arrow-up-right'} size={17} color={colors[tone]} />
      </View>
      <View style={[styles.body, divider && styles.divider]}>
        <View style={styles.flex}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {t.description || t.category}
          </AppText>
          <AppText variant="small" color="secondary" numberOfLines={1}>
            {[
              // Skip the category when the description already ends with it.
              !(t.description || '').endsWith(t.category) && t.category,
              relativeDay(t.date, new Date(), 'd MMM yyyy'),
              t.method,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
        <View style={styles.amount}>
          <AppText variant="bodyMedium" color={income ? 'success' : 'primary'}>
            {income ? '+' : '−'}
            {format(t.amount)}
          </AppText>
          {t.status === 'pending' ? <Badge label="Bekliyor" tone="warning" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = t => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { opacity: 0.6 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  flex: { flex: 1 },
  amount: { alignItems: 'flex-end', gap: 4 },
});
