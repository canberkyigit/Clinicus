import React from 'react';
import { Alert, Share, Switch, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Card from '../../../shared/components/Card';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { useToast } from '../../../shared/components/Toast';
import { authErrorMessage, displayNameOf, useAuth } from '../../../shared/context/AuthContext';
import { useAppData } from '../../../shared/context/AppDataContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { canUseBiometrics } from '../../auth/components/AppLockGate';
import appConfig from '../../../../app.json';

const THEMES = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

export default function SettingsScreen({ navigation }) {
  const { user, signOut, resetPassword, isDemo } = useAuth();
  const data = useAppData();
  const { settings, updateSettings, resetData } = data;
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const toast = useToast();

  const toggle = (key, title, hint, icon, tone, onChange) => (
    <ListItem
      icon={icon}
      iconTone={tone}
      title={title}
      subtitle={hint}
      trailing={
        <Switch
          value={!!settings[key]}
          onValueChange={onChange || (value => updateSettings({ [key]: value }))}
          trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
          thumbColor="#fff"
          accessibilityLabel={title}
        />
      }
    />
  );

  const toggleAppLock = async value => {
    if (value && !(await canUseBiometrics())) {
      Alert.alert('Kullanılamıyor', 'Bu cihazda Face ID / Touch ID veya cihaz kilidi ayarlı değil.');
      return;
    }
    updateSettings({ appLock: value });
    toast.show(value ? 'Uygulama kilidi açıldı' : 'Uygulama kilidi kapatıldı');
  };

  const exportData = () => {
    const payload = Object.fromEntries(
      ['patients', 'appointments', 'transactions', 'personnel', 'inventory', 'leaveRequests', 'specialRequests'].map(k => [k, data[k]])
    );
    Share.share({ title: 'Clinicus yedeği', message: JSON.stringify({ exportedAt: new Date().toISOString(), ...payload }) }).catch(() => {});
  };

  const confirmReset = () =>
    Alert.alert('Verileri sıfırla', 'Tüm hasta, randevu, finans ve stok kayıtları silinip demo veriler geri yüklenecek. Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => {
          resetData();
          toast.show('Demo veriler yüklendi', { tone: 'info' });
        },
      },
    ]);

  const sendReset = async () => {
    try {
      await resetPassword(user.email);
      toast.show('Şifre sıfırlama e-postası gönderildi');
    } catch (err) {
      Alert.alert('Hata', authErrorMessage(err));
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapılsın mı?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut().catch(err => Alert.alert('Hata', authErrorMessage(err))) },
    ]);

  return (
    <Screen title="Ayarlar" onBack={navigation.goBack}>
      <Card>
        <View style={styles.account}>
          <Avatar uri={user?.photoURL} name={displayNameOf(user) || user?.email} size={58} />
          <View style={styles.flex}>
            <AppText variant="h3">{user?.displayName || displayNameOf(user) || 'Kullanıcı'}</AppText>
            <AppText variant="small" color="secondary">
              {user?.email}
            </AppText>
            {isDemo ? (
              <AppText variant="caption" color="warning">
                Demo modu · veriler yalnızca bu cihazda
              </AppText>
            ) : null}
          </View>
        </View>
      </Card>

      <Section title="Görünüm">
        <AppText variant="smallMedium" color="secondary" style={styles.label}>
          Tema
        </AppText>
        <SegmentedControl options={THEMES} value={settings.themeMode} onChange={themeMode => updateSettings({ themeMode })} />
      </Section>

      <Section title="Gizlilik ve güvenlik" padded={false}>
        {toggle('appLock', 'Uygulama kilidi', 'Face ID / Touch ID ile koru', 'lock', 'success', toggleAppLock)}
        {toggle('hideFinanceValues', 'Tutarları gizle', 'Finansal değerler **** görünür', 'eye-off', 'warning')}
      </Section>

      <Section title="Tercihler" padded={false}>
        {toggle('haptics', 'Dokunsal geri bildirim', 'Butonlarda titreşim', 'smartphone', 'info')}
      </Section>

      <Section title="Veriler" padded={false}>
        <ListItem icon="database" iconTone="purple" title="Kayıtlar" subtitle={`${data.patients.length} hasta · ${data.appointments.length} randevu · ${data.transactions.length} işlem`} />
        <ListItem icon="download" iconTone="info" title="Verileri dışa aktar" subtitle="JSON olarak paylaş" chevron onPress={exportData} />
        <ListItem icon="refresh-cw" iconTone="danger" title="Demo verilerini yükle" subtitle="Tüm kayıtları sıfırlar" chevron onPress={confirmReset} divider={false} />
      </Section>

      <Section title="Hesap" padded={false}>
        {!isDemo ? <ListItem icon="key" iconTone="neutral" title="Şifre sıfırlama e-postası" chevron onPress={sendReset} /> : null}
        <ListItem icon="log-out" iconTone="danger" title="Çıkış yap" onPress={confirmSignOut} divider={false} />
      </Section>

      <AppText variant="caption" color="tertiary" align="center" style={styles.version}>
        {appConfig.expo.name} · v{appConfig.expo.version}
      </AppText>
    </Screen>
  );
}

function Section({ title, padded = true, children }) {
  const styles = useStyles(makeStyles);
  return (
    <View>
      <AppText variant="caption" color="tertiary" style={styles.sectionTitle}>
        {title.toLocaleUpperCase('tr-TR')}
      </AppText>
      <Card padded={padded} style={!padded && styles.listCard}>
        {children}
      </Card>
    </View>
  );
}

const makeStyles = () => ({
  flex: { flex: 1 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sectionTitle: { marginTop: 8, marginBottom: 8, marginLeft: 4 },
  label: { marginBottom: 8 },
  listCard: { paddingHorizontal: 14 },
  version: { marginTop: 8 },
});
