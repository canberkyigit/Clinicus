// Domain constants. `tone` values map to theme colors (colors[tone] and
// colors[`${tone}Muted`]) so badges look right in both light and dark mode.

export const APPOINTMENT_STATUS = {
  scheduled: { label: 'Planlandı', tone: 'info', icon: 'clock' },
  completed: { label: 'Tamamlandı', tone: 'success', icon: 'check-circle' },
  cancelled: { label: 'İptal', tone: 'danger', icon: 'x-circle' },
  noshow: { label: 'Gelmedi', tone: 'warning', icon: 'user-x' },
};

export const APPOINTMENT_TYPES = [
  { value: 'Muayene', fee: 1500, duration: 30 },
  { value: 'Kontrol', fee: 800, duration: 30 },
  { value: 'Tetkik', fee: 1200, duration: 30 },
  { value: 'İşlem', fee: 3000, duration: 60 },
];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export const REQUEST_STATUS = {
  pending: { label: 'Beklemede', tone: 'warning' },
  approved: { label: 'Onaylandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
};

export const PRIORITY = {
  high: { label: 'Yüksek', tone: 'danger' },
  medium: { label: 'Orta', tone: 'warning' },
  low: { label: 'Düşük', tone: 'success' },
};

export const ROLES = ['Doktor', 'Hemşire', 'Sekreter'];
export const ROLE_TONES = { Doktor: 'success', Hemşire: 'purple', Sekreter: 'info' };

export const PERSONNEL_STATUS = ['Aktif', 'İzinli', 'Pasif'];
export const PERSONNEL_STATUS_TONES = { Aktif: 'success', İzinli: 'warning', Pasif: 'danger' };

export const PAYMENT_METHODS = ['Kart', 'Nakit', 'Havale'];
export const INCOME_CATEGORIES = ['Muayene', 'Kontrol', 'Tetkik', 'İşlem', 'Diğer Gelir'];
export const EXPENSE_CATEGORIES = ['Maaşlar', 'Kira', 'Tıbbi Malzeme', 'Faturalar', 'Reklam', 'Bakım', 'Diğer'];

export const TRANSACTION_STATUS = {
  paid: { label: 'Ödendi', tone: 'success' },
  pending: { label: 'Bekliyor', tone: 'warning' },
};

export const INSURANCE_TYPES = ['SGK', 'Özel Sigorta', 'Tamamlayıcı', 'Yok'];
export const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];
export const GENDERS = ['Kadın', 'Erkek'];

export const INVENTORY_CATEGORIES = ['Sarf Malzeme', 'İlaç', 'Koruyucu Ekipman', 'Laboratuvar'];

export function statusMeta(map, key) {
  return map[key] || { label: 'Bilinmiyor', tone: 'neutral' };
}
