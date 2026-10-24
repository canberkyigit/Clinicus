import { format } from 'date-fns';
import { toISODate } from '../../../shared/utils/date';
import { TIME_SLOTS } from '../../../shared/data/constants';

export function filterAppointments(appointments, { clinicId, doctorId, patientId } = {}) {
  return appointments.filter(
    a =>
      (!clinicId || a.clinicId === clinicId) &&
      (!doctorId || a.doctorId === doctorId) &&
      (!patientId || a.patientId === patientId)
  );
}

export function sortAppointments(list, direction = 'asc') {
  const sorted = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return direction === 'asc' ? sorted : sorted.reverse();
}

export function groupByDate(appointments) {
  const groups = {};
  appointments.forEach(a => {
    (groups[a.date] = groups[a.date] || []).push(a);
  });
  Object.values(groups).forEach(list => list.sort((x, y) => x.time.localeCompare(y.time)));
  return groups;
}

export function appointmentsInMonth(appointments, date) {
  const prefix = format(date, 'yyyy-MM');
  return appointments.filter(a => a.date.startsWith(prefix));
}

export function appointmentsOnDay(appointments, date) {
  const iso = typeof date === 'string' ? date : toISODate(date);
  return appointments.filter(a => a.date === iso);
}

export function appointmentsBetween(appointments, startIso, endIso) {
  return appointments.filter(a => a.date >= startIso && a.date <= endIso);
}

export function statusCounts(appointments) {
  const counts = { total: appointments.length, completed: 0, scheduled: 0, cancelled: 0, noshow: 0 };
  appointments.forEach(a => {
    counts[a.status] = (counts[a.status] || 0) + 1;
  });
  return counts;
}

// Returns [{ key, count }] sorted by count desc, ignoring cancelled appointments.
export function rankBy(appointments, keyFn) {
  const counts = new Map();
  appointments.forEach(a => {
    if (a.status === 'cancelled') return;
    const key = keyFn(a);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key), 'tr'));
}

// Slots a doctor is already booked for on a day (cancelled ones are free again).
export function busySlots(appointments, { doctorId, date, excludeId }) {
  return new Set(
    appointments
      .filter(a => a.doctorId === doctorId && a.date === date && a.id !== excludeId && a.status !== 'cancelled')
      .map(a => a.time)
  );
}

export function freeSlots(appointments, query) {
  const busy = busySlots(appointments, query);
  return TIME_SLOTS.filter(s => !busy.has(s));
}

export function upcoming(appointments, now = new Date(), limit = Infinity) {
  const iso = toISODate(now);
  const time = format(now, 'HH:mm');
  return sortAppointments(
    appointments.filter(a => a.status === 'scheduled' && (a.date > iso || (a.date === iso && a.time >= time)))
  ).slice(0, limit);
}
