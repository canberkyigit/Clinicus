import { subDays } from 'date-fns';
import { clinicCity } from '../../../shared/data/clinics';
import { formatCurrency } from '../../../shared/utils/format';
import { toISODate } from '../../../shared/utils/date';

// Notifications are derived from app state rather than stored; only their read
// state is persisted. Each id is stable so "read" survives re-derivation.
export function buildNotifications(state, now = new Date()) {
  const todayIso = toISODate(now);
  const overdueLimit = toISODate(subDays(now, 14));
  const items = [];

  const todays = state.appointments.filter(a => a.date === todayIso && a.status === 'scheduled');
  if (todays.length) {
    items.push({
      id: `today-${todayIso}`,
      tone: 'info',
      icon: 'calendar',
      title: `Bugün ${todays.length} randevu var`,
      message: `İlk randevu ${todays.reduce((min, a) => (a.time < min ? a.time : min), '23:59')}.`,
      date: todayIso,
      route: { name: 'Calendar' },
    });
  }

  [...state.leaveRequests, ...state.specialRequests]
    .filter(r => r.status === 'pending')
    .forEach(r => {
      const isLeave = 'requestType' in r;
      items.push({
        id: `req-${r.id}`,
        tone: 'warning',
        icon: isLeave ? 'sun' : 'file-text',
        title: isLeave ? 'Yeni izin talebi' : 'Yeni özel talep',
        message: `${r.employeeName} · ${isLeave ? r.requestType : r.requestTitle}`,
        date: r.submittedDate,
        route: { name: 'Requests' },
      });
    });

  state.inventory
    .filter(i => i.quantity <= i.minQuantity)
    .forEach(i => {
      items.push({
        id: `stock-${i.id}-${i.quantity}`,
        tone: i.quantity === 0 ? 'danger' : 'warning',
        icon: 'package',
        title: i.quantity === 0 ? 'Stok tükendi' : 'Kritik stok seviyesi',
        message: `${i.name} · ${clinicCity(i.clinicId)} (${i.quantity} ${i.unit})`,
        date: i.updatedAt,
        route: { name: 'Inventory' },
      });
    });

  state.transactions
    .filter(t => t.type === 'income' && t.status === 'pending' && t.date <= overdueLimit)
    .forEach(t => {
      items.push({
        id: `due-${t.id}`,
        tone: 'danger',
        icon: 'alert-circle',
        title: 'Gecikmiş tahsilat',
        message: `${t.description} · ${formatCurrency(t.amount)}`,
        date: t.date,
        route: t.patientId ? { name: 'PatientDetail', params: { id: t.patientId } } : { name: 'Transactions' },
      });
    });

  const read = new Set(state.readNotificationIds);
  return items
    .map(n => ({ ...n, read: read.has(n.id) }))
    .sort((a, b) => Number(a.read) - Number(b.read) || (b.date || '').localeCompare(a.date || ''));
}
