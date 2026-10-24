import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/shared/context/AuthContext';
import { AppDataProvider, useAppData } from './src/shared/context/AppDataContext';
import { ThemeProvider, useTheme } from './src/shared/theme/ThemeProvider';
import { ToastProvider } from './src/shared/components/Toast';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Deep links, e.g. clinicus://patients/h1 (exp://<host>/--/patients/h1 in Expo Go).
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Main: { screens: { Home: 'home', Calendar: 'calendar', Patients: 'patients', Menu: 'menu' } },
      PatientDetail: 'patients/:id',
      AppointmentDetail: 'appointments/:id',
      AppointmentForm: 'new/appointment',
      PatientForm: 'new/patient',
      TransactionForm: 'new/transaction/:type',
      Finance: 'finance',
      Transactions: 'transactions',
      Reports: 'reports',
      Personnel: 'personnel',
      PersonnelProfile: 'personnel/:id',
      Clinics: 'clinics',
      ClinicDetail: 'clinics/:id',
      Requests: 'requests',
      Inventory: 'inventory',
      Notifications: 'notifications',
      Search: 'search',
      Settings: 'settings',
      Login: 'login',
    },
  },
};

function ThemedApp() {
  const { settings } = useAppData();
  return (
    <ThemeProvider mode={settings.themeMode}>
      <ThemedNavigation />
    </ThemeProvider>
  );
}

function ThemedNavigation() {
  const theme = useTheme();
  const base = theme.isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };
  return (
    <ToastProvider>
      <NavigationContainer theme={navigationTheme} linking={linking}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </ToastProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const ready = fontsLoaded || !!fontError;

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    // Never keep the splash forever if layout doesn't fire (e.g. in tests).
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppDataProvider>
            <ThemedApp />
          </AppDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
