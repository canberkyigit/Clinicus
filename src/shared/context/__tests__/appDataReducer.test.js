import { appDataReducer, createInitialState, DEFAULT_SETTINGS } from '../AppDataContext';

const base = { ...createInitialState(new Date(2026, 9, 24, 12)), hydrated: true };
const scheduled = base.appointments.find(a => a.status === 'scheduled');

describe('appDataReducer', () => {
  it('hydrates and keeps defaults for new settings', () => {
    const next = appDataReducer(createInitialState(), { type: 'hydrate', payload: { settings: { haptics: false } } });
    expect(next.hydrated).toBe(true);
    expect(next.settings).toEqual({ ...DEFAULT_SETTINGS, haptics: false });
  });

  it('adds generic entities with generated ids and request defaults', () => {
    const next = appDataReducer(base, { type: 'entity/add', entity: 'leaveRequests', payload: { personnelId: 'p1', reason: 'x' } });
    expect(next.leaveRequests[0]).toMatchObject({ status: 'pending', personnelId: 'p1' });
    expect(next.leaveRequests[0].id).toMatch(/^l/);
    expect(next.leaveRequests[0].submittedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps appointment names in sync when a patient is renamed', () => {
    const patientId = scheduled.patientId;
    const next = appDataReducer(base, {
      type: 'entity/update',
      entity: 'patients',
      payload: { id: patientId, firstName: 'Yeni', lastName: 'İsim' },
    });
    expect(next.patients.find(p => p.id === patientId).name).toBe('Yeni İsim');
    next.appointments.filter(a => a.patientId === patientId).forEach(a => expect(a.patientName).toBe('Yeni İsim'));
  });

  it('drops only scheduled appointments when a patient is removed', () => {
    const patientId = scheduled.patientId;
    const completedBefore = base.appointments.filter(a => a.patientId === patientId && a.status !== 'scheduled').length;
    const next = appDataReducer(base, { type: 'entity/remove', entity: 'patients', id: patientId });
    expect(next.patients.some(p => p.id === patientId)).toBe(false);
    expect(next.appointments.filter(a => a.patientId === patientId)).toHaveLength(completedBefore);
  });

  it('detaches staff when their doctor is removed', () => {
    const next = appDataReducer(base, { type: 'entity/remove', entity: 'personnel', id: 'p1' });
    expect(next.personnel.find(p => p.id === 'p6').connectedToId).toBeUndefined();
  });

  it('books a receivable when an appointment is completed and removes it when undone', () => {
    const done = appDataReducer(base, { type: 'appointments/setStatus', id: scheduled.id, status: 'completed' });
    const receivable = done.transactions.find(t => t.appointmentId === scheduled.id);
    expect(receivable).toMatchObject({ type: 'income', status: 'pending', amount: scheduled.fee });

    const undone = appDataReducer(done, { type: 'appointments/setStatus', id: scheduled.id, status: 'scheduled' });
    expect(undone.transactions.some(t => t.appointmentId === scheduled.id)).toBe(false);
    expect(undone.appointments.find(a => a.id === scheduled.id).status).toBe('scheduled');
  });

  it('keeps a collected payment when an appointment status changes', () => {
    const done = appDataReducer(base, { type: 'appointments/setStatus', id: scheduled.id, status: 'completed' });
    const tx = done.transactions.find(t => t.appointmentId === scheduled.id);
    const paid = appDataReducer(done, { type: 'entity/update', entity: 'transactions', payload: { id: tx.id, status: 'paid' } });
    const cancelled = appDataReducer(paid, { type: 'appointments/setStatus', id: scheduled.id, status: 'cancelled' });
    expect(cancelled.transactions.find(t => t.id === tx.id).status).toBe('paid');
  });

  it('never lets stock go negative', () => {
    const item = base.inventory[0];
    const next = appDataReducer(base, { type: 'inventory/adjust', id: item.id, delta: -1e6 });
    expect(next.inventory[0].quantity).toBe(0);
  });

  it('marks notifications read without duplicates', () => {
    const once = appDataReducer(base, { type: 'notifications/read', ids: ['a', 'b'] });
    const twice = appDataReducer(once, { type: 'notifications/read', ids: ['b', 'c'] });
    expect(twice.readNotificationIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('resets data but keeps settings', () => {
    const changed = appDataReducer(base, { type: 'settings/update', payload: { themeMode: 'dark' } });
    const removed = appDataReducer(changed, { type: 'entity/remove', entity: 'patients', id: 'h1' });
    const reset = appDataReducer(removed, { type: 'reset' });
    expect(reset.settings.themeMode).toBe('dark');
    expect(reset.patients.some(p => p.id === 'h1')).toBe(true);
  });
});
