import React from 'react';
import { Feather } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoadingScreen from '../shared/components/LoadingScreen';
import { useAuth } from '../shared/context/AuthContext';
import { useAppData } from '../shared/context/AppDataContext';
import { useTheme } from '../shared/theme/ThemeProvider';
import TabBar from './TabBar';
import AppLockGate from '../modules/auth/components/AppLockGate';
import LoginScreen from '../modules/auth/screens/LoginScreen';
import HomeScreen from '../modules/home/screens/HomeScreen';
import CalendarScreen from '../modules/calendar/screens/CalendarScreen';
import AppointmentDetailScreen from '../modules/calendar/screens/AppointmentDetailScreen';
import AppointmentFormScreen from '../modules/calendar/screens/AppointmentFormScreen';
import PatientsScreen from '../modules/patients/screens/PatientsScreen';
import PatientDetailScreen from '../modules/patients/screens/PatientDetailScreen';
import PatientFormScreen from '../modules/patients/screens/PatientFormScreen';
import MenuScreen from '../modules/menu/screens/MenuScreen';
import FinanceScreen from '../modules/finance/screens/FinanceScreen';
import TransactionsScreen from '../modules/finance/screens/TransactionsScreen';
import TransactionFormScreen from '../modules/finance/screens/TransactionFormScreen';
import ReportsScreen from '../modules/reports/screens/ReportsScreen';
import PersonnelScreen from '../modules/personnel/screens/PersonnelScreen';
import PersonnelProfileScreen from '../modules/personnel/screens/PersonnelProfileScreen';
import PersonnelFormScreen from '../modules/personnel/screens/PersonnelFormScreen';
import ClinicsScreen from '../modules/clinics/screens/ClinicsScreen';
import ClinicDetailScreen from '../modules/clinics/screens/ClinicDetailScreen';
import RequestsScreen from '../modules/requests/screens/RequestsScreen';
import LeaveRequestFormScreen from '../modules/requests/screens/LeaveRequestFormScreen';
import SpecialRequestFormScreen from '../modules/requests/screens/SpecialRequestFormScreen';
import InventoryScreen from '../modules/inventory/screens/InventoryScreen';
import InventoryFormScreen from '../modules/inventory/screens/InventoryFormScreen';
import NotificationsScreen from '../modules/notifications/screens/NotificationsScreen';
import SearchScreen from '../modules/search/screens/SearchScreen';
import SettingsScreen from '../modules/settings/screens/SettingsScreen';
import { useNotifications } from '../modules/notifications/useNotifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = name =>
  function TabIcon({ color, size }) {
    return <Feather name={name} size={size} color={color} />;
  };

function MainTabs() {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa', tabBarIcon: tabIcon('home') }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim', tabBarIcon: tabIcon('calendar') }} />
      <Tab.Screen name="Patients" component={PatientsScreen} options={{ title: 'Hastalar', tabBarIcon: tabIcon('users') }} />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Menü', tabBarIcon: tabIcon('grid'), tabBarBadge: unreadCount || undefined }}
      />
    </Tab.Navigator>
  );
}

const FORMS = [
  ['AppointmentForm', AppointmentFormScreen],
  ['PatientForm', PatientFormScreen],
  ['TransactionForm', TransactionFormScreen],
  ['PersonnelForm', PersonnelFormScreen],
  ['LeaveRequestForm', LeaveRequestFormScreen],
  ['SpecialRequestForm', SpecialRequestFormScreen],
  ['InventoryForm', InventoryFormScreen],
];

const PAGES = [
  ['AppointmentDetail', AppointmentDetailScreen],
  ['PatientDetail', PatientDetailScreen],
  ['Finance', FinanceScreen],
  ['Transactions', TransactionsScreen],
  ['Reports', ReportsScreen],
  ['Personnel', PersonnelScreen],
  ['PersonnelProfile', PersonnelProfileScreen],
  ['Clinics', ClinicsScreen],
  ['ClinicDetail', ClinicDetailScreen],
  ['Requests', RequestsScreen],
  ['Inventory', InventoryScreen],
  ['Notifications', NotificationsScreen],
  ['Settings', SettingsScreen],
];

export default function RootNavigator() {
  const { colors } = useTheme();
  const { user, initializing } = useAuth();
  const { hydrated } = useAppData();

  if (initializing || !hydrated) return <LoadingScreen />;

  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
    animation: 'slide_from_right',
  };

  if (!user) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    );
  }

  return (
    <AppLockGate>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Main" component={MainTabs} />
        {PAGES.map(([name, component]) => (
          <Stack.Screen key={name} name={name} component={component} />
        ))}
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade_from_bottom' }} />
        <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
          {FORMS.map(([name, component]) => (
            <Stack.Screen key={name} name={name} component={component} />
          ))}
        </Stack.Group>
      </Stack.Navigator>
    </AppLockGate>
  );
}
