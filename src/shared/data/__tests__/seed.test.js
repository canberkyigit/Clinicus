import { createSeed } from '../seed';
import { TIME_SLOTS } from '../constants';

const TODAY = new Date(2026, 9, 24, 12, 0); // Saturday 24 Oct 2026, 12:00
const seed = createSeed(TODAY);

describe('createSeed', () => {
  it('is deterministic for a given day', () => {
    expect(createSeed(TODAY)).toEqual(seed);
  });

  it('creates every collection', () => {
    ['personnel', 'patients', 'appointments', 'transactions', 'inventory', 'leaveRequests', 'specialRequests'].forEach(key => {
      expect(seed[key].length).toBeGreaterThan(0);
    });
  });

  it('only books appointments on open days, in valid slots, after registration', () => {
    const patients = Object.fromEntries(seed.patients.map(p => [p.id, p]));
    seed.appointments.forEach(a => {
      expect(new Date(`${a.date}T12:00:00`).getDay()).not.toBe(0);
      expect(TIME_SLOTS).toContain(a.time);
      expect(a.date >= patients[a.patientId].createdAt).toBe(true);
    });
  });

  it('never double-books a doctor', () => {
    const keys = seed.appointments.filter(a => a.status !== 'cancelled').map(a => `${a.doctorId}|${a.date}|${a.time}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('marks only past appointments as completed/cancelled/no-show', () => {
    seed.appointments.forEach(a => {
      const past = a.date < '2026-10-24' || (a.date === '2026-10-24' && a.time < '12:00');
      if (past) expect(['completed', 'cancelled', 'noshow']).toContain(a.status);
      else expect(a.status).toBe('scheduled');
    });
  });

  it('books one income per completed appointment and no future expenses', () => {
    const completed = seed.appointments.filter(a => a.status === 'completed');
    const incomes = seed.transactions.filter(t => t.type === 'income');
    expect(incomes).toHaveLength(completed.length);
    seed.transactions.filter(t => t.type === 'expense').forEach(t => expect(t.date <= '2026-10-24').toBe(true));
    expect(new Set(seed.transactions.map(t => t.id)).size).toBe(seed.transactions.length);
  });

  it('has some patients registered this month', () => {
    expect(seed.patients.some(p => p.createdAt >= '2026-10-01')).toBe(true);
  });
});
