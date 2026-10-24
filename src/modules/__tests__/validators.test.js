import { validateAppointment } from '../calendar/screens/AppointmentFormScreen';
import { validatePatient } from '../patients/screens/PatientFormScreen';
import { validateTransaction } from '../finance/screens/TransactionFormScreen';
import { validateInventory } from '../inventory/screens/InventoryFormScreen';
import { fromForm, toForm, validatePersonnel } from '../personnel/screens/PersonnelFormScreen';
import { validateLeave } from '../requests/screens/LeaveRequestFormScreen';
import { validateSpecial } from '../requests/screens/SpecialRequestFormScreen';
import personnelData from '../personnel/data/personnelData';

describe('appointment validation', () => {
  const valid = { patientId: 'h1', doctorId: 'p1', date: '2026-10-26', time: '09:00', fee: '1500' };

  it('accepts a valid booking', () => {
    expect(validateAppointment(valid, new Set())).toEqual({});
  });

  it('rejects Sundays, taken slots and bad fees', () => {
    expect(validateAppointment({ ...valid, date: '2026-10-25' }, new Set())).toHaveProperty('date');
    expect(validateAppointment(valid, new Set(['09:00']))).toHaveProperty('time');
    expect(validateAppointment({ ...valid, fee: '12a' }, new Set())).toHaveProperty('fee');
    expect(Object.keys(validateAppointment({ fee: '' }, new Set())).sort()).toEqual(['date', 'doctorId', 'patientId', 'time']);
  });
});

describe('patient validation', () => {
  const valid = { firstName: 'Ayşe', lastName: 'Kaya', phone: '0532 111 22 33', email: '', birthDate: '1990-01-01' };
  it('accepts valid input and flags bad fields', () => {
    expect(validatePatient(valid)).toEqual({});
    expect(Object.keys(validatePatient({ ...valid, firstName: 'A', phone: '123', email: 'x', birthDate: '2999-01-01' })).sort()).toEqual([
      'birthDate',
      'email',
      'firstName',
      'phone',
    ]);
  });
});

describe('transaction validation', () => {
  const valid = { type: 'income', amount: '500', category: 'Muayene', date: '2026-10-24', description: '' };
  it('requires a positive amount and an expense description', () => {
    expect(validateTransaction(valid)).toEqual({});
    expect(validateTransaction({ ...valid, amount: '0' })).toHaveProperty('amount');
    expect(validateTransaction({ ...valid, type: 'expense' })).toHaveProperty('description');
  });
});

describe('inventory validation', () => {
  it('requires name and whole quantities', () => {
    expect(validateInventory({ name: 'Eldiven', quantity: '5', minQuantity: '2', unitCost: '' })).toEqual({});
    expect(Object.keys(validateInventory({ name: '', quantity: '', minQuantity: '1.5', unitCost: '' })).sort()).toEqual([
      'minQuantity',
      'name',
      'quantity',
    ]);
  });
});

describe('personnel form', () => {
  it('round-trips a record', () => {
    const back = fromForm(toForm(personnelData[0]));
    expect(back.age).toBe(38);
    expect(back.languages).toEqual(['Türkçe', 'İngilizce']);
    expect(back.caseCount).toBe(1200);
  });

  it('drops role-specific fields', () => {
    const nurse = fromForm({ ...toForm(), name: 'Ayşe K', role: 'Hemşire', caseCount: '5', connectedToId: 'p1' });
    expect(nurse.caseCount).toBeUndefined();
    expect(nurse.connectedToId).toBe('p1');
  });

  it('validates fields', () => {
    expect(validatePersonnel(toForm())).toHaveProperty('name');
    expect(Object.keys(validatePersonnel({ ...toForm(), name: 'Ali Veli', age: '12', email: 'x', phone: '1' })).sort()).toEqual([
      'age',
      'email',
      'phone',
    ]);
  });
});

describe('request validation', () => {
  it('validates leave ranges', () => {
    const valid = { personnelId: 'p1', startDate: '2026-11-01', endDate: '2026-11-03', reason: 'Tatil' };
    expect(validateLeave(valid)).toEqual({});
    expect(validateLeave({ ...valid, endDate: '2026-10-01' })).toHaveProperty('endDate');
  });

  it('validates special requests', () => {
    expect(validateSpecial({ personnelId: 'p1', requestTitle: 'Yeni PC' })).toEqual({});
    expect(Object.keys(validateSpecial({ requestTitle: 'a' })).sort()).toEqual(['personnelId', 'requestTitle']);
  });
});
