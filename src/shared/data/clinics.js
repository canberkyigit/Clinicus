// Single source of truth for branch names. Personnel, appointments and finance
// records all reference clinics by `id`.
export const CLINICS = [
  { id: 'ankara', name: 'Ankara Merkez Klinik', city: 'Ankara' },
  { id: 'istanbul', name: 'İstanbul Şube Klinik', city: 'İstanbul' },
  { id: 'izmir', name: 'İzmir Merkez Klinik', city: 'İzmir' },
  { id: 'kocaeli', name: 'Kocaeli Şube Klinik', city: 'Kocaeli' },
];

const byId = Object.fromEntries(CLINICS.map(c => [c.id, c]));

export function getClinic(id) {
  return byId[id] || null;
}

export function clinicCity(id) {
  return byId[id]?.city || '-';
}

export function clinicName(id) {
  return byId[id]?.name || '-';
}
