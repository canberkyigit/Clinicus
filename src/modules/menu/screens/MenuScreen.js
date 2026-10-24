import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Card from '../../../shared/components/Card';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import { authErrorMessage, displayNameOf, useAuth } from '../../../shared/context/AuthContext';
import { useAppData, usePendingRequestCount } from '../../../shared/context/AppDataContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { useNotifications } from '../../notifications/useNotifications';
import appConfig from '../../../../app.json';

export default function MenuScreen({ navigation }) {
  const { user, signOut, isDemo } = useAuth();
  const { inventory, personnel } = useAppData();
  const pendingRequests = usePendingRequestCount();
  const { unreadCount } = useNotifications();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const lowStock = inventory.filter(i => i.quantity <= i.minQuantity).length;

  const modules = [
    { route: 'Finance', icon: 'trending-up', tone: 'success', label: 'Finans', hint: 'Gelir, gider, alacak' },
    { route: 'Reports', icon: 'bar-chart-2', tone: 'info', label: 'Raporlar', hint: 'Performans analizi' },
    { route: 'Personnel', icon: 'briefcase', tone: 'purple', label: 'Personel', hint: `${personnel.length} çalışan` },
    { route: 'Clinics', icon: 'map-pin', tone: 'warning', label: 'Klinikler', hint: 'Şube yönetimi' },
    { route: 'Requests', icon: 'inbox', tone: 'danger', label: 'Talepler', hint: 'İzin ve özel talepler', badge: pendingRequests },
    { route: 'Inventory', icon: 'package', tone: 'success', label: 'Stok', hint: 'Malzeme takibi', badge: lowStock },
  ];

  const confirmSignOut = () =>
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapılsın mı?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut().catch(err => Alert.alert('Hata', authErrorMessage(err))) },
    ]);

  return (
    <Screen title="Menü" large tabBar>
      <Card onPress={() => navigation.navigate('Settings')}>
        <View style={styles.profile}>
          <Avatar uri={user?.photoURL} name={displayNameOf(user) || user?.email} size={54} />
          <View style={styles.flex}>
            <AppText variant="h3">{user?.displayName || displayNameOf(user) || 'Kullanıcı'}</AppText>
            <AppText variant="small" color="secondary" numberOfLines={1}>
              {user?.email}
            </AppText>
            {isDemo ? (
              <AppText variant="caption" color="warning">
                Demo modu
              </AppText>
            ) : null}
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      <View style={styles.grid}>
        {modules.map(m => (
          <Pressable
            key={m.route}
            onPress={() => navigation.navigate(m.route)}
            accessibilityRole="button"
            accessibilityLabel={m.badge ? `${m.label}, ${m.badge} uyarı` : m.label}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <View style={styles.tileTop}>
              <View style={[styles.tileIcon, { backgroundColor: colors[`${m.tone}Muted`] }]}>
                <Feather name={m.icon} size={20} color={colors[m.tone]} />
              </View>
              {m.badge ? (
                <View style={styles.badge}>
                  <AppText variant="caption" color="#fff">
                    {m.badge}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="bodyMedium">{m.label}</AppText>
            <AppText variant="small" color="tertiary" numberOfLines={1}>
              {m.hint}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Card padded={false} style={styles.listCard}>
        <ListItem
          icon="bell"
          iconTone="warning"
          title="Bildirimler"
          trailing={unreadCount ? <AppText variant="smallMedium" color="danger">{unreadCount} yeni</AppText> : null}
          chevron
          onPress={() => navigation.navigate('Notifications')}
        />
        <ListItem icon="search" iconTone="info" title="Genel arama" chevron onPress={() => navigation.navigate('Search')} />
        <ListItem icon="settings" iconTone="neutral" title="Ayarlar" chevron onPress={() => navigation.navigate('Settings')} />
        <ListItem icon="log-out" iconTone="danger" title="Çıkış yap" onPress={confirmSignOut} divider={false} />
      </Card>

      <AppText variant="caption" color="tertiary" align="center">
        {appConfig.expo.name} · v{appConfig.expo.version}
      </AppText>
    </Screen>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  tile: {
    width: '47%',
    flexGrow: 1,
    gap: 2,
    padding: 16,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  pressed: { backgroundColor: t.colors.surfacePressed },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tileIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: t.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: { paddingHorizontal: 14 },
});
