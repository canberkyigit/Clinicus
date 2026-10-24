import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

const AuthContext = createContext(null);

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/user-not-found': 'E-posta veya şifre hatalı.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
  'auth/network-request-failed': 'Ağ bağlantısı kurulamadı. İnternetinizi kontrol edin.',
  'auth/email-already-in-use': 'Bu e-posta ile zaten bir hesap var.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/missing-password': 'Lütfen şifre giriniz.',
};

export function authErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}

// Lets developers explore the app without a Firebase project. Never available in
// production builds or when real credentials are configured.
const DEMO_AVAILABLE = __DEV__ && !isFirebaseConfigured;
const DEMO_USER = Object.freeze({ uid: 'demo', email: 'demo@clinicus.app', displayName: 'Demo Kullanıcı' });

function requireAuth() {
  if (!auth) {
    throw Object.assign(new Error('Firebase yapılandırılmamış.'), { code: 'app/not-configured' });
  }
  return auth;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    DEMO_AVAILABLE && process.env.EXPO_PUBLIC_DEMO_AUTOLOGIN === '1' ? DEMO_USER : null
  );
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, current => {
      setUser(current);
      setInitializing(false);
    });
  }, []);

  const isDemo = user === DEMO_USER;

  const value = useMemo(
    () => ({
      user,
      initializing,
      isDemo,
      isConfigured: isFirebaseConfigured,
      canUseDemo: DEMO_AVAILABLE,
      // Successful sign-in/sign-up updates `user` via onAuthStateChanged, which
      // switches the navigator to the app stack.
      signIn: (email, password) => signInWithEmailAndPassword(requireAuth(), email.trim(), password),
      signUp: (email, password) => createUserWithEmailAndPassword(requireAuth(), email.trim(), password),
      resetPassword: email => sendPasswordResetEmail(requireAuth(), email.trim()),
      signOut: async () => {
        if (isDemo) setUser(null);
        else await firebaseSignOut(requireAuth());
      },
      startDemo: () => DEMO_AVAILABLE && setUser(DEMO_USER),
    }),
    [user, initializing, isDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function displayNameOf(user) {
  if (!user) return '';
  if (user.displayName) return user.displayName.split(' ')[0];
  const local = (user.email || '').split('@')[0].split(/[._-]/)[0];
  return local ? local.charAt(0).toLocaleUpperCase('tr-TR') + local.slice(1) : '';
}
