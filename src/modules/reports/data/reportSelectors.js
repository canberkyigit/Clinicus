import { addMonths, format, getDay, startOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { parseISODate, toISODate } from '../../../shared/utils/date';

const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Aggregates appointment statistics for the last `months` months (inclusive of
// the current month, up to today).
export function buildReport({ appointments, patients, personnel }, months, today = new Date()) {
  const start = toISODate(startOfMonth(subMonths(today, months - 1)));
  const end = toISODate(today);
  const list = appointments.filter(a => a.date >= start && a.date <= end && a.status !== 'scheduled');
  const total = list.length;
  const count = status => list.filter(a => a.status === status).length;
  const completed = list.filter(a => a.status === 'completed');
  const rate = n => (total ? Math.round((n / total) * 1000) / 10 : 0);

  const monthly = Array.from({ length: months }, (_, i) => {
    const d = addMonths(parseISODate(start), i);
    const key = format(d, 'yyyy-MM');
    const inMonth = list.filter(a => a.date.startsWith(key));
    return {
      key,
      label: format(d, 'MMM', { locale: tr }),
      tooltipLabel: format(d, 'MMMM yyyy', { locale: tr }),
      values: [inMonth.filter(a => a.status === 'completed').length, inMonth.filter(a => a.status !== 'completed').length],
      revenue: inMonth.filter(a => a.status === 'completed').reduce((s, a) => s + (a.fee || 0), 0),
    };
  });

  const doctorById = Object.fromEntries(personnel.map(p => [p.id, p]));
  const tally = (items, keyFn) => {
    const map = new Map();
    items.forEach(item => {
      const key = keyFn(item);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  const hours = Array.from({ length: 9 }, (_, i) => 9 + i).map(h => ({
    key: String(h),
    label: String(h),
    tooltipLabel: `${h}:00 – ${h + 1}:00`,
    values: [list.filter(a => Number(a.time.slice(0, 2)) === h).length],
  }));
  const weekdays = [1, 2, 3, 4, 5, 6].map(d => ({
    key: String(d),
    label: WEEKDAYS[d],
    values: [list.filter(a => getDay(parseISODate(a.date)) === d).length],
  }));

  return {
    start,
    end,
    total,
    completed: completed.length,
    completionRate: rate(completed.length),
    noShowRate: rate(count('noshow')),
    cancelRate: rate(count('cancelled')),
    averageFee: completed.length ? Math.round(completed.reduce((s, a) => s + (a.fee || 0), 0) / completed.length) : 0,
    newPatients: patients.filter(p => p.createdAt >= start && p.createdAt <= end).length,
    monthly,
    bySpecialty: tally(completed, a => doctorById[a.doctorId]?.specialty || 'Diğer'),
    byType: tally(completed, a => a.type),
    hours,
    weekdays,
  };
}
