import { startOfMonth } from 'date-fns';
import { CLINICS } from '../../../shared/data/clinics';
import { toISODate } from '../../../shared/utils/date';

export function clinicStats({ personnel, appointments, transactions, inventory }, now = new Date()) {
  const todayIso = toISODate(now);
  const monthStart = toISODate(startOfMonth(now));
  return CLINICS.map(clinic => {
    const staff = personnel.filter(p => p.clinicId === clinic.id);
    const appts = appointments.filter(a => a.clinicId === clinic.id && a.status !== 'cancelled');
    const income = transactions.filter(t => t.clinicId === clinic.id && t.type === 'income' && t.date >= monthStart && t.date <= todayIso);
    const expense = transactions.filter(t => t.clinicId === clinic.id && t.type === 'expense' && t.date >= monthStart && t.date <= todayIso);
    return {
      ...clinic,
      staff,
      doctors: staff.filter(p => p.role === 'Doktor'),
      activeStaff: staff.filter(p => p.status === 'Aktif').length,
      today: appts.filter(a => a.date === todayIso),
      monthAppointments: appts.filter(a => a.date >= monthStart && a.date <= todayIso).length,
      income: income.reduce((s, t) => s + t.amount, 0),
      expense: expense.reduce((s, t) => s + t.amount, 0),
      lowStock: inventory.filter(i => i.clinicId === clinic.id && i.quantity <= i.minQuantity),
    };
  });
}
