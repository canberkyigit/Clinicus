import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import logo from '../../../../assets/logo1.png';
import AppText from '../../../shared/components/AppText';
import Button from '../../../shared/components/Button';
import FormField from '../../../shared/components/FormField';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { authErrorMessage, useAuth } from '../../../shared/context/AuthContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { EMAIL_REGEX } from '../../../shared/utils/format';

const MODES = [
  { value: 'login', label: 'Giriş Yap' },
  { value: 'signup', label: 'Kayıt Ol' },
];

export default function LoginScreen() {
  const { signIn, signUp, resetPassword, isConfigured, canUseDemo, startDemo } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const isSignup = mode === 'signup';

  const switchMode = next => {
    setMode(next);
    setErrors({});
    setPassword('');
    setPasswordConfirm('');
  };

  const validate = () => {
    const next = {};
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Geçerli bir e-posta girin.';
    if (!password) next.password = 'Şifre girin.';
    else if (isSignup && password.length < 6) next.password = 'Şifre en az 6 karakter olmalı.';
    if (isSignup && password !== passwordConfirm) next.passwordConfirm = 'Şifreler eşleşmiyor.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      // On success AuthContext swaps to the app stack and unmounts this screen.
      await (isSignup ? signUp(email, password) : signIn(email, password));
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrors({ email: 'Şifre sıfırlama için e-posta adresinizi girin.' });
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('E-posta gönderildi', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
          <AppText variant="display">Clinicus</AppText>
          <AppText variant="body" color="secondary" align="center">
            Randevu, hasta, personel ve finans yönetimi tek yerde.
          </AppText>
        </View>

        {!isConfigured ? (
          <View style={styles.warning}>
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <AppText variant="small" color="warning" style={styles.flex}>
              Firebase yapılandırması bulunamadı. `.env` dosyasını oluşturup uygulamayı yeniden başlatın.
            </AppText>
          </View>
        ) : null}

        <SegmentedControl options={MODES} value={mode} onChange={switchMode} style={styles.segment} />

        <FormField
          label="E-posta"
          icon="mail"
          placeholder="ornek@klinik.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.email}
        />
        <FormField
          ref={passwordRef}
          label="Şifre"
          icon="lock"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          textContentType={isSignup ? 'newPassword' : 'password'}
          returnKeyType={isSignup ? 'next' : 'go'}
          onSubmitEditing={() => (isSignup ? confirmRef.current?.focus() : submit())}
          error={errors.password}
          right={
            <Pressable
              onPress={() => setShowPassword(v => !v)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color={colors.textTertiary} />
            </Pressable>
          }
        />
        {isSignup ? (
          <FormField
            ref={confirmRef}
            label="Şifre (tekrar)"
            icon="lock"
            placeholder="••••••••"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={errors.passwordConfirm}
          />
        ) : (
          <Pressable onPress={forgotPassword} style={styles.forgot} accessibilityRole="button" hitSlop={8}>
            <AppText variant="smallMedium" color="brand">
              Şifremi unuttum
            </AppText>
          </Pressable>
        )}

        {errors.form ? (
          <View style={styles.formError}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <AppText variant="small" color="danger" style={styles.flex}>
              {errors.form}
            </AppText>
          </View>
        ) : null}

        <Button title={isSignup ? 'Hesap Oluştur' : 'Giriş Yap'} onPress={submit} loading={loading} disabled={!isConfigured} />

        {canUseDemo ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color="tertiary">
                VEYA
              </AppText>
              <View style={styles.dividerLine} />
            </View>
            <Button title="Demo modunda devam et" icon="play-circle" variant="outline" onPress={startDemo} />
          </>
        ) : null}

        <AppText variant="caption" color="tertiary" align="center" style={styles.footer}>
          Devam ederek KVKK kapsamında hasta verilerinin korunmasına ilişkin sorumlulukları kabul etmiş olursunuz.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = t => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  brand: { alignItems: 'center', gap: 6, marginBottom: 28 },
  logo: { width: 76, height: 76, borderRadius: 20, marginBottom: 10 },
  warning: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: t.colors.warningMuted,
    borderRadius: t.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  segment: { marginBottom: 20 },
  eye: { paddingHorizontal: 14, paddingVertical: 10 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  formError: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: t.colors.dangerMuted,
    borderRadius: t.radius.md,
    padding: 12,
    marginBottom: 14,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.border },
  footer: { marginTop: 24 },
});
