import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, getDay } from 'date-fns';
import { AuthProvider } from '../shared/context/AuthContext';
import { AppDataProvider, useAppData } from '../shared/context/AppDataContext';
import { ThemeProvider } from '../shared/theme/ThemeProvider';
import { ToastProvider } from '../shared/components/Toast';
import { toISODate } from '../shared/utils/date';
import { freeSlots } from '../modules/calendar/data/appointmentSelectors';
import { createSeed } from '../shared/data/seed';
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

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

// Exposes the live store to assertions.
let store;
function Probe({ children }) {
  store = useAppData();
  return store.hydrated ? children : null;
}

function Themed({ children }) {
  const { settings } = useAppData();
  return <ThemeProvider mode={settings.themeMode}>{children}</ThemeProvider>;
}

async function renderScreen(Screen, params = {}) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), push: jest.fn(), replace: jest.fn() };
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AuthProvider>
        <AppDataProvider>
          <Themed>
            <ToastProvider>
              <Probe>
                <Screen navigation={navigation} route={{ params }} />
              </Probe>
            </ToastProvider>
          </Themed>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
  await waitFor(() => expect(store?.hydrated).toBe(true));
  return navigation;
}

function pressAlertButton(label) {
  const buttons = Alert.alert.mock.calls.at(-1)[2];
  act(() => buttons.find(b => b.text === label).onPress());
}

function nextWeekday() {
  let d = addDays(new Date(), 7);
  while (getDay(d) === 0) d = addDays(d, 1);
  return toISODate(d);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// The provider seeds from today's date deterministically, so a future
// scheduled appointment from the same seed exists in the rendered store.
const futureScheduled = () => {
  const tomorrow = toISODate(addDays(new Date(), 1));
  return createSeed(new Date()).appointments.find(a => a.status === 'scheduled' && a.date >= tomorrow);
};

describe('every screen renders', () => {
  it.each([
    ['Login', LoginScreen, {}, 'Giriş Yap'],
    ['Home', HomeScreen, {}, 'Sıradaki Randevular'],
    ['Calendar', CalendarScreen, {}, 'Takvim'],
    ['Patients', PatientsScreen, {}, 'Hastalar'],
    ['PatientDetail', PatientDetailScreen, { id: 'h1' }, 'Hasta Dosyası'],
    ['PatientForm', PatientFormScreen, {}, 'Yeni Hasta'],
    ['Menu', MenuScreen, {}, 'Menü'],
    ['Finance', FinanceScreen, {}, 'Net kâr · Bu Ay'],
    ['Transactions', TransactionsScreen, {}, 'İşlemler'],
    ['TransactionForm', TransactionFormScreen, { type: 'expense' }, 'Yeni Gider'],
    ['Reports', ReportsScreen, {}, 'Raporlar'],
    ['Personnel', PersonnelScreen, {}, 'Personel'],
    ['PersonnelProfile', PersonnelProfileScreen, { id: 'p1' }, 'Personel Profili'],
    ['PersonnelForm', PersonnelFormScreen, {}, 'Yeni Personel'],
    ['Clinics', ClinicsScreen, {}, 'Klinikler'],
    ['ClinicDetail', ClinicDetailScreen, { id: 'ankara' }, 'Ankara Merkez Klinik'],
    ['Requests', RequestsScreen, {}, 'Talepler'],
    ['LeaveRequestForm', LeaveRequestFormScreen, {}, 'İzin Talebi'],
    ['SpecialRequestForm', SpecialRequestFormScreen, {}, 'Özel Talep'],
    ['Inventory', InventoryScreen, {}, 'Stok'],
    ['InventoryForm', InventoryFormScreen, {}, 'Yeni Stok Kalemi'],
    ['Notifications', NotificationsScreen, {}, 'Bildirimler'],
    ['Search', SearchScreen, {}, 'Aramaya başlayın'],
    ['Settings', SettingsScreen, {}, 'Ayarlar'],
  ])('%s', async (_, Screen, params, text) => {
    await renderScreen(Screen, params);
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  });

  it('AppointmentDetail', async () => {
    const target = futureScheduled();
    await renderScreen(AppointmentDetailScreen, { id: target.id });
    expect(screen.getAllByText(target.patientName).length).toBeGreaterThan(0);
  });

  it('shows a not-found state for missing records', async () => {
    await renderScreen(AppointmentDetailScreen, { id: 'missing' });
    expect(screen.getByText('Randevu bulunamadı')).toBeTruthy();
  });
});

describe('appointments', () => {
  it('validates and creates an appointment in a free slot', async () => {
    const date = nextWeekday();
    const navigation = await renderScreen(AppointmentFormScreen, { patientId: 'h1', doctorId: 'p1', date });
    const before = store.appointments.length;
    const slot = freeSlots(store.appointments, { doctorId: 'p1', date })[0];

    fireEvent.press(screen.getAllByText('Oluştur').at(-1));
    expect(screen.getByText('Saat seçin.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText(slot));
    fireEvent.press(screen.getAllByText('Oluştur').at(-1));

    expect(navigation.goBack).toHaveBeenCalled();
    expect(store.appointments).toHaveLength(before + 1);
    expect(store.appointments[0]).toMatchObject({ date, time: slot, doctorId: 'p1', patientId: 'h1', status: 'scheduled' });
    expect(screen.getByText(`Randevu oluşturuldu · ${slot}`)).toBeTruthy();
  });

  it('completes an appointment and collects the fee', async () => {
    const target = futureScheduled();
    await renderScreen(AppointmentDetailScreen, { id: target.id });

    fireEvent.press(screen.getByText('Tamamlandı'));
    expect(store.appointments.find(a => a.id === target.id).status).toBe('completed');
    expect(store.transactions.find(t => t.appointmentId === target.id).status).toBe('pending');

    fireEvent.press(screen.getByText('Tahsil Et'));
    expect(store.transactions.find(t => t.appointmentId === target.id).status).toBe('paid');
  });
});

describe('patients', () => {
  it('validates and adds a patient', async () => {
    const navigation = await renderScreen(PatientFormScreen);
    fireEvent.press(screen.getAllByText('Ekle').at(-1));
    expect(screen.getByText('Ad en az 2 karakter olmalı.')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Ad'), 'Deniz');
    fireEvent.changeText(screen.getByLabelText('Soyad'), 'Ak');
    fireEvent.changeText(screen.getByLabelText('Telefon'), '0532 000 11 22');
    fireEvent.press(screen.getAllByText('Ekle').at(-1));

    const created = store.patients.find(p => p.name === 'Deniz Ak');
    expect(created).toBeTruthy();
    expect(navigation.replace).toHaveBeenCalledWith('PatientDetail', { id: created.id });
  });

  it('filters the patient list by search', async () => {
    await renderScreen(PatientsScreen);
    const someone = store.patients[0];
    fireEvent.changeText(screen.getByLabelText('İsim, telefon veya e-posta'), someone.phone);
    expect(screen.getAllByText(someone.name).length).toBeGreaterThan(0);
  });
});

describe('finance', () => {
  it('requires a description for expenses and saves them', async () => {
    const navigation = await renderScreen(TransactionFormScreen, { type: 'expense' });
    const before = store.transactions.length;
    fireEvent.changeText(screen.getByLabelText('Tutar'), '2500');
    fireEvent.press(screen.getAllByText('Kaydet').at(-1));
    expect(screen.getByText('Gider için açıklama girin.')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Açıklama'), 'Klima bakımı');
    fireEvent.press(screen.getAllByText('Kaydet').at(-1));
    expect(store.transactions).toHaveLength(before + 1);
    expect(store.transactions[0]).toMatchObject({ type: 'expense', amount: 2500, description: 'Klima bakımı' });
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('masks amounts when values are hidden', async () => {
    await renderScreen(FinanceScreen);
    expect(screen.queryAllByText('****')).toHaveLength(0);
    fireEvent.press(screen.getByLabelText('Değerleri gizle'));
    expect(screen.queryAllByText(/\*\*\*\*/).length).toBeGreaterThan(3);
  });
});

describe('operations', () => {
  it('adjusts stock with the stepper', async () => {
    await renderScreen(InventoryScreen);
    // The list is sorted by urgency, so read the first rendered item's id back.
    fireEvent.changeText(screen.getByLabelText('Malzeme ara'), 'Serum');
    const before = store.inventory.filter(i => i.name === 'Serum Fizyolojik').reduce((s, i) => s + i.quantity, 0);
    fireEvent.press(screen.getAllByLabelText('Serum Fizyolojik artır')[0]);
    const after = store.inventory.filter(i => i.name === 'Serum Fizyolojik').reduce((s, i) => s + i.quantity, 0);
    expect(after).toBe(before + 1);
  });

  it('approves a pending leave request with undo available', async () => {
    await renderScreen(RequestsScreen);
    const pending = store.leaveRequests.filter(r => r.status === 'pending').length;
    fireEvent.press(screen.getAllByText('Onayla')[0]);
    pressAlertButton('Onayla');
    expect(store.leaveRequests.filter(r => r.status === 'pending')).toHaveLength(pending - 1);
    expect(screen.getByText('Talep onaylandı')).toBeTruthy();
    fireEvent.press(screen.getByText('Geri al'));
    expect(store.leaveRequests.filter(r => r.status === 'pending')).toHaveLength(pending);
  });

  it('switches the theme from settings', async () => {
    await renderScreen(SettingsScreen);
    fireEvent.press(screen.getByText('Koyu'));
    expect(store.settings.themeMode).toBe('dark');
  });

  it('searches across modules', async () => {
    await renderScreen(SearchScreen);
    fireEvent.changeText(screen.getByLabelText('Hasta, randevu, personel, stok...'), 'Ahmet');
    // Sections are virtualized; the first ones are enough to prove cross-module search.
    expect(screen.getByText(/^HASTALAR/)).toBeTruthy();
    expect(screen.getAllByText(/Dr\. Ahmet Yılmaz/).length).toBeGreaterThan(0);
  });

  it('marks all notifications read', async () => {
    await renderScreen(NotificationsScreen);
    fireEvent.press(screen.getByLabelText('Tümünü okundu işaretle'));
    expect(store.readNotificationIds.length).toBeGreaterThan(0);
    expect(screen.getByText('Hepsi okundu')).toBeTruthy();
  });
});
