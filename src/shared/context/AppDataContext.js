import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSeed } from '../data/seed';
import { toISODate } from '../utils/date';
import { formatCurrency } from '../utils/format';

export const STORAGE_KEY = 'clinic-app/data/v2';
const LEGACY_STORAGE_KEY = 'clinic-app/data/v1';

const PERSISTED_KEYS = [
  'personnel',
  'patients',
  'appointments',
  'transactions',
  'inventory',
  'leaveRequests',
  'specialRequests',
  'settings',
  'readNotificationIds',
];

export const DEFAULT_SETTINGS = {
  hideFinanceValues: false,
  themeMode: 'system', // 'system' | 'light' | 'dark'
  haptics: true,
  appLock: false,
};

export function createInitialState(today = new Date()) {
  return {
    hydrated: false,
    ...createSeed(today),
    settings: DEFAULT_SETTINGS,
    readNotificationIds: [],
  };
}

const PREFIX = {
  personnel: 'p',
  patients: 'h',
  appointments: 'a',
  transactions: 't',
  inventory: 's',
  leaveRequests: 'l',
  specialRequests: 'r',
};

export const newId = prefix => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const today = () => toISODate(new Date());

function upsert(list, id, patch) {
  return list.map(item => (item.id === id ? { ...item, ...patch } : item));
}

export function appDataReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...action.payload,
        // Merge so settings added in later versions keep their defaults.
        settings: { ...DEFAULT_SETTINGS, ...state.settings, ...action.payload.settings },
        hydrated: true,
      };
    case 'reset':
      return { ...createInitialState(), settings: state.settings, hydrated: true };

    case 'entity/add': {
      const { entity, payload } = action;
      const record = { ...payload, id: payload.id || newId(PREFIX[entity]) };
      if (entity === 'leaveRequests' || entity === 'specialRequests') {
        Object.assign(record, { status: 'pending', submittedDate: today() });
      }
      if (entity === 'patients') record.createdAt = record.createdAt || today();
      return { ...state, [entity]: [record, ...state[entity]] };
    }
    case 'entity/update': {
      const { entity, payload } = action;
      const next = { ...state, [entity]: upsert(state[entity], payload.id, payload) };
      // Keep denormalized names on appointments in sync.
      if (entity === 'patients' && payload.firstName !== undefined) {
        const name = `${payload.firstName} ${payload.lastName}`.trim();
        next.patients = upsert(next.patients, payload.id, { name });
        next.appointments = state.appointments.map(a => (a.patientId === payload.id ? { ...a, patientName: name } : a));
      }
      if (entity === 'personnel' && payload.name !== undefined) {
        next.appointments = state.appointments.map(a =>
          a.doctorId === payload.id ? { ...a, doctorName: payload.name } : a
        );
      }
      return next;
    }
    case 'entity/remove': {
      const { entity, id } = action;
      const next = { ...state, [entity]: state[entity].filter(item => item.id !== id) };
      if (entity === 'personnel') {
        // Detach staff that were assigned to the removed doctor.
        next.personnel = next.personnel.map(p => (p.connectedToId === id ? { ...p, connectedToId: undefined } : p));
      }
      if (entity === 'patients') {
        // History stays (with the name snapshot); future bookings are dropped.
        next.appointments = state.appointments.filter(a => !(a.patientId === id && a.status === 'scheduled'));
      }
      return next;
    }

    case 'appointments/setStatus': {
      const { id, status } = action;
      const appointment = state.appointments.find(a => a.id === id);
      if (!appointment) return state;
      let transactions = state.transactions;
      const existing = transactions.find(t => t.appointmentId === id);
      if (status === 'completed' && !existing && appointment.fee > 0) {
        // Completing a visit books the fee as a receivable until it's collected.
        transactions = [
          {
            id: newId('t'),
            type: 'income',
            date: appointment.date,
            amount: appointment.fee,
            category: appointment.type,
            clinicId: appointment.clinicId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointmentId: id,
            method: 'Kart',
            status: 'pending',
            description: `${appointment.patientName} · ${appointment.type}`,
          },
          ...transactions,
        ];
      } else if (status !== 'completed' && existing && existing.status === 'pending') {
        // Undoing a completion removes the uncollected receivable.
        transactions = transactions.filter(t => t.id !== existing.id);
      }
      return { ...state, transactions, appointments: upsert(state.appointments, id, { status }) };
    }

    case 'inventory/adjust': {
      const item = state.inventory.find(i => i.id === action.id);
      if (!item) return state;
      const quantity = Math.max(0, item.quantity + action.delta);
      return { ...state, inventory: upsert(state.inventory, action.id, { quantity, updatedAt: today() }) };
    }

    case 'notifications/read': {
      const ids = new Set([...state.readNotificationIds, ...action.ids]);
      return { ...state, readNotificationIds: [...ids] };
    }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

async function loadPersisted() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  // One-time migration from v1, which only stored personnel, requests and settings.
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return {};
  const { personnel, settings } = JSON.parse(legacy);
  return { ...(personnel && { personnel }), ...(settings && { settings }) };
}

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(appDataReducer, undefined, () => createInitialState());
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadPersisted()
      .then(saved => !cancelled && dispatch({ type: 'hydrate', payload: saved }))
      .catch(() => !cancelled && dispatch({ type: 'hydrate', payload: {} }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Don't overwrite stored data with the seed before hydration finishes.
    if (!state.hydrated) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const data = Object.fromEntries(PERSISTED_KEYS.map(k => [k, state[k]]));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const actions = useMemo(() => {
    const entity = (name, singular) => ({
      [`add${singular}`]: payload => {
        const id = payload.id || newId(PREFIX[name]);
        dispatch({ type: 'entity/add', entity: name, payload: { ...payload, id } });
        return id;
      },
      [`update${singular}`]: payload => dispatch({ type: 'entity/update', entity: name, payload }),
      [`remove${singular}`]: id => dispatch({ type: 'entity/remove', entity: name, id }),
    });
    return {
      ...entity('personnel', 'Personnel'),
      ...entity('patients', 'Patient'),
      ...entity('appointments', 'Appointment'),
      ...entity('transactions', 'Transaction'),
      ...entity('inventory', 'InventoryItem'),
      ...entity('leaveRequests', 'LeaveRequest'),
      ...entity('specialRequests', 'SpecialRequest'),
      setAppointmentStatus: (id, status) => dispatch({ type: 'appointments/setStatus', id, status }),
      adjustInventory: (id, delta) => dispatch({ type: 'inventory/adjust', id, delta }),
      markNotificationsRead: ids => dispatch({ type: 'notifications/read', ids }),
      updateSettings: payload => dispatch({ type: 'settings/update', payload }),
      resetData: () => dispatch({ type: 'reset' }),
    };
  }, []);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}

export function useLookup(entity) {
  const list = useAppData()[entity];
  return useMemo(() => Object.fromEntries(list.map(item => [item.id, item])), [list]);
}

export function usePendingRequestCount() {
  const { leaveRequests, specialRequests } = useAppData();
  return useMemo(
    () => [...leaveRequests, ...specialRequests].filter(r => r.status === 'pending').length,
    [leaveRequests, specialRequests]
  );
}

// Formats money while honouring the global "hide financial values" preference.
export function useMoney() {
  const { settings, updateSettings } = useAppData();
  const hidden = settings.hideFinanceValues;
  const format = useCallback((value, options) => formatCurrency(value, { hidden, ...options }), [hidden]);
  const toggleHidden = useCallback(() => updateSettings({ hideFinanceValues: !hidden }), [hidden, updateSettings]);
  return { format, hidden, toggleHidden };
}
