import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import IconButton from '../../../shared/components/IconButton';
import EmptyState from '../../../shared/components/EmptyState';
import Screen from '../../../shared/components/Screen';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { relativeDay } from '../../../shared/utils/date';
import { useNotifications } from '../useNotifications';

export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <Screen
      title="Bildirimler"
      subtitle={unreadCount ? `${unreadCount} okunmamış` : 'Hepsi okundu'}
      onBack={navigation.goBack}
      scroll={false}
      right={unreadCount ? <IconButton icon="check-circle" onPress={markAllRead} accessibilityLabel="Tümünü okundu işaretle" /> : null}
    >
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => {
              markRead(n.id);
              navigation.navigate(n.route.name, n.route.params);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${n.read ? '' : 'Okunmamış. '}${n.title}. ${n.message}`}
            style={({ pressed }) => [styles.item, !n.read && styles.unread, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: colors[`${n.tone}Muted`] }]}>
              <Feather name={n.icon} size={18} color={colors[n.tone]} />
            </View>
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <AppText variant="bodyMedium" style={styles.flex} numberOfLines={1}>
                  {n.title}
                </AppText>
                <AppText variant="caption" color="tertiary">
                  {relativeDay(n.date, new Date(), 'd MMM')}
                </AppText>
              </View>
              <AppText variant="small" color="secondary" numberOfLines={2}>
                {n.message}
              </AppText>
            </View>
            {!n.read ? <View style={styles.dot} /> : null}
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="bell-off" title="Bildirim yok" message="Yeni bir gelişme olduğunda burada göreceksiniz." />}
      />
    </Screen>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  unread: { borderColor: t.colors.borderStrong },
  pressed: { backgroundColor: t.colors.surfacePressed },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary },
});
