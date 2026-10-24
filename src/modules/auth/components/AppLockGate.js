import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import logo from '../../../../assets/logo1.png';
import AppText from '../../../shared/components/AppText';
import Button from '../../../shared/components/Button';
import { useAppData } from '../../../shared/context/AppDataContext';
import { useStyles } from '../../../shared/theme/ThemeProvider';

// Re-lock after the app has been in the background for this long.
const RELOCK_AFTER_MS = 30 * 1000;

// When "Uygulama kilidi" is on, covers the app until Face ID / Touch ID /
// device passcode succeeds — on launch and when returning from background.
export default function AppLockGate({ children }) {
  const { settings } = useAppData();
  const styles = useStyles(makeStyles);
  const [locked, setLocked] = useState(settings.appLock);
  const [error, setError] = useState('');
  const backgroundedAt = useRef(null);

  const unlock = useCallback(async () => {
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Clinicus kilidini aç',
        cancelLabel: 'Vazgeç',
        fallbackLabel: 'Şifre kullan',
      });
      if (result.success) setLocked(false);
      else if (result.error !== 'user_cancel') setError('Doğrulama başarısız. Tekrar deneyin.');
    } catch {
      setError('Biyometrik doğrulama kullanılamıyor.');
    }
  }, []);

  useEffect(() => {
    if (!settings.appLock) setLocked(false);
  }, [settings.appLock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (!settings.appLock) return;
      if (next === 'background') backgroundedAt.current = Date.now();
      if (next === 'active' && backgroundedAt.current && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [settings.appLock]);

  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  return (
    <View style={styles.flex}>
      {children}
      {locked ? (
        <View style={[StyleSheet.absoluteFill, styles.lock]}>
          <Image source={logo} style={styles.logo} />
          <AppText variant="h1">Uygulama kilitli</AppText>
          <AppText variant="body" color="secondary" align="center">
            Hasta verilerini korumak için kimliğinizi doğrulayın.
          </AppText>
          {error ? (
            <AppText variant="small" color="danger">
              {error}
            </AppText>
          ) : null}
          <Button title="Kilidi Aç" icon="unlock" onPress={unlock} style={styles.button} />
        </View>
      ) : null}
    </View>
  );
}

export async function canUseBiometrics() {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && enrolled;
}

const makeStyles = t => ({
  flex: { flex: 1 },
  lock: {
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
    zIndex: 999,
  },
  logo: { width: 84, height: 84, borderRadius: 22, marginBottom: 12 },
  button: { marginTop: 16, alignSelf: 'stretch' },
});
