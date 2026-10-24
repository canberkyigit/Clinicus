import { addDays, endOfMonth, format, getDate, getDay, startOfMonth, subMonths, addMonths, subDays } from 'date-fns';
import personnelData from '../../modules/personnel/data/personnelData';
import { CLINICS } from './clinics';
import { APPOINTMENT_TYPES, BLOOD_TYPES, INSURANCE_TYPES, PAYMENT_METHODS, TIME_SLOTS } from './constants';
import { toISODate } from '../utils/date';
import { createRandom } from '../utils/random';

const FEMALE_NAMES = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Gizem', 'Seda', 'Derya', 'Ece', 'Buse', 'İrem', 'Nur', 'Selin', 'Deniz'];
const MALE_NAMES = ['Ahmet', 'Mehmet', 'Can', 'Hasan', 'Burak', 'Emre', 'Okan', 'Kerem', 'Murat', 'Ali', 'Kaan', 'Onur', 'Serkan', 'Yusuf'];
const SURNAMES = ['Yıldırım', 'Demir', 'Çelik', 'Kaya', 'Özkan', 'Yıldız', 'Polat', 'Acar', 'Şen', 'Kurt', 'Doğan', 'Aksu', 'Tekin', 'Uçar', 'Bulut', 'Aydın', 'Koç', 'Arslan', 'Erdem', 'Güneş'];
const ALLERGIES = ['Penisilin', 'Polen', 'Lateks', 'Aspirin', 'Fıstık', 'Toz akarı'];
const CONDITIONS = ['Hipertansiyon', 'Diyabet', 'Astım', 'Migren', 'Hipotiroidi', 'Kolesterol'];

const PATIENT_COUNT = 56;
const HISTORY_MONTHS = 11;

const pad = n => String(n).padStart(2, '0');

function phone(rand) {
  return `05${rand.int(30, 55)} ${rand.int(100, 999)} ${pad(rand.int(0, 99))} ${pad(rand.int(0, 99))}`;
}

function slug(text) {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

// ~55% of patients exist from the start of the history; the rest register on
// random days up to today, so "new patients" stats are meaningful.
function createPatients(rand, historyStart, today) {
  const historyDays = Math.max(1, Math.round((today - historyStart) / 86400000));
  return Array.from({ length: PATIENT_COUNT }, (_, i) => {
    const female = rand.chance(0.52);
    const firstName = rand.pick(female ? FEMALE_NAMES : MALE_NAMES);
    const lastName = rand.pick(SURNAMES);
    return {
      id: `h${i + 1}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      gender: female ? 'Kadın' : 'Erkek',
      birthDate: `${rand.int(1948, 2016)}-${pad(rand.int(1, 12))}-${pad(rand.int(1, 28))}`,
      phone: phone(rand),
      email: rand.chance(0.7) ? `${slug(firstName)}.${slug(lastName)}${rand.int(1, 99)}@mail.com` : '',
      bloodType: rand.pick(BLOOD_TYPES),
      insurance: rand.pick(INSURANCE_TYPES),
      allergies: rand.chance(0.3) ? rand.sample(ALLERGIES, rand.int(1, 2)) : [],
      conditions: rand.chance(0.35) ? rand.sample(CONDITIONS, rand.int(1, 2)) : [],
      clinicId: rand.pick(CLINICS).id,
      notes: '',
      createdAt: toISODate(rand.chance(0.55) ? historyStart : addDays(historyStart, rand.int(1, historyDays))),
    };
  });
}

function createAppointments(rand, today, patients, doctors) {
  const todayIso = toISODate(today);
  const nowTime = format(today, 'HH:mm');
  const start = startOfMonth(subMonths(today, HISTORY_MONTHS));
  const end = endOfMonth(addMonths(today, 1));
  const result = [];

  for (let day = start; day <= end; day = addDays(day, 1)) {
    const weekday = getDay(day);
    if (weekday === 0) continue; // closed on Sundays
    const iso = toISODate(day);
    const count = weekday === 6 ? rand.int(1, 3) : rand.int(2, 6);
    const slots = rand.sample(TIME_SLOTS, count).sort();
    // Only patients registered by this day can have an appointment on it.
    const registered = patients.filter(p => p.createdAt <= iso);
    if (!registered.length) continue;

    slots.forEach((time, index) => {
      const doctor = rand.pick(doctors);
      const local = registered.filter(p => p.clinicId === doctor.clinicId);
      const patient = rand.pick(local.length ? local : registered);
      const type = rand.next() < 0.5 ? APPOINTMENT_TYPES[0] : rand.pick(APPOINTMENT_TYPES);
      const isPast = iso < todayIso || (iso === todayIso && time < nowTime);
      let status = 'scheduled';
      if (isPast) {
        const r = rand.next();
        status = r < 0.82 ? 'completed' : r < 0.92 ? 'cancelled' : 'noshow';
      }
      result.push({
        id: `a${iso.replace(/-/g, '')}${index}`,
        date: iso,
        time,
        duration: type.duration,
        type: type.value,
        fee: type.fee + rand.int(0, 4) * 100,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        clinicId: doctor.clinicId,
        status,
        notes: '',
      });
    });
  }
  return result;
}

function createTransactions(rand, today, appointments) {
  const todayIso = toISODate(today);
  const recentLimit = toISODate(subDays(today, 45));
  const transactions = [];

  appointments
    .filter(a => a.status === 'completed')
    .forEach(a => {
      transactions.push({
        id: `t${a.id}`,
        type: 'income',
        date: a.date,
        amount: a.fee,
        category: a.type,
        clinicId: a.clinicId,
        patientId: a.patientId,
        doctorId: a.doctorId,
        appointmentId: a.id,
        method: rand.pick(PAYMENT_METHODS),
        // Only recent visits can still be unpaid.
        status: a.date >= recentLimit && rand.chance(0.08) ? 'pending' : 'paid',
        description: `${a.patientName} · ${a.type}`,
      });
    });

  const firstMonth = startOfMonth(subMonths(today, HISTORY_MONTHS));
  for (let m = firstMonth; m <= today; m = addMonths(m, 1)) {
    const monthKey = format(m, 'yyyyMM');
    const expense = (clinicId, day, category, amount, description) => {
      const date = toISODate(addDays(m, Math.min(day, getDate(endOfMonth(m))) - 1));
      if (date > todayIso) return;
      transactions.push({
        id: `e${monthKey}${clinicId}${category.slice(0, 3)}`,
        type: 'expense',
        date,
        amount,
        category,
        clinicId,
        method: 'Havale',
        status: 'paid',
        description,
      });
    };
    CLINICS.forEach(c => {
      expense(c.id, 5, 'Kira', 4000 + rand.int(0, 5) * 500, `${c.city} kira`);
      expense(c.id, 28, 'Maaşlar', 12000 + rand.int(0, 6) * 1000, `${c.city} personel maaşları`);
      expense(c.id, rand.int(8, 22), 'Tıbbi Malzeme', 1500 + rand.int(0, 10) * 150, 'Sarf malzeme alımı');
      expense(c.id, 20, 'Faturalar', 900 + rand.int(0, 6) * 100, 'Elektrik, su, internet');
    });
    expense('istanbul', 12, 'Reklam', 3000 + rand.int(0, 6) * 500, 'Dijital reklam');
    if (rand.chance(0.3)) expense(rand.pick(CLINICS).id, rand.int(1, 25), 'Bakım', 1500 + rand.int(0, 8) * 250, 'Cihaz bakımı');
  }
  return transactions;
}

const SUPPLIES = [
  { name: 'Muayene Eldiveni', category: 'Koruyucu Ekipman', unit: 'kutu', min: 20, cost: 180 },
  { name: 'Cerrahi Maske', category: 'Koruyucu Ekipman', unit: 'kutu', min: 15, cost: 120 },
  { name: 'Enjektör 5 ml', category: 'Sarf Malzeme', unit: 'adet', min: 200, cost: 4 },
  { name: 'Steril Gazlı Bez', category: 'Sarf Malzeme', unit: 'paket', min: 40, cost: 35 },
  { name: 'Serum Fizyolojik', category: 'İlaç', unit: 'şişe', min: 30, cost: 28 },
  { name: 'Antiseptik Solüsyon', category: 'Sarf Malzeme', unit: 'litre', min: 10, cost: 95 },
  { name: 'Hızlı Test Kiti', category: 'Laboratuvar', unit: 'kutu', min: 8, cost: 650 },
  { name: 'Lokal Anestezik', category: 'İlaç', unit: 'kutu', min: 6, cost: 420 },
];

function createInventory(rand, today) {
  const items = [];
  CLINICS.forEach(clinic => {
    SUPPLIES.forEach((s, i) => {
      const low = rand.chance(0.15);
      items.push({
        id: `s${clinic.id}${i}`,
        name: s.name,
        category: s.category,
        clinicId: clinic.id,
        unit: s.unit,
        minQuantity: s.min,
        quantity: low ? rand.int(0, Math.floor(s.min * 0.8)) : rand.int(s.min, s.min * 4),
        unitCost: s.cost,
        updatedAt: toISODate(subDays(today, rand.int(0, 20))),
      });
    });
  });
  return items;
}

function createRequests(today) {
  const d = n => toISODate(addDays(today, n));
  return {
    leaveRequests: [
      { id: 'l1', personnelId: 'p2', employeeName: 'Dr. Elif Demir', requestType: 'Mazeret İzni', startDate: d(6), endDate: d(7), reason: 'Sağlık kontrolü', detail: '', status: 'pending', submittedDate: d(-1) },
      { id: 'l2', personnelId: 'p7', employeeName: 'Selin Aydın', requestType: 'Yıllık İzin', startDate: d(14), endDate: d(20), reason: 'Aile ziyareti', detail: '', status: 'pending', submittedDate: d(-2) },
      { id: 'l3', personnelId: 'p1', employeeName: 'Dr. Ahmet Yılmaz', requestType: 'Yıllık İzin', startDate: d(-40), endDate: d(-31), reason: 'Tatil', detail: '', status: 'approved', submittedDate: d(-60) },
    ],
    specialRequests: [
      { id: 's1', personnelId: 'p8', employeeName: 'Murat Aksoy', requestCategory: 'Ekipman Talebi', requestTitle: 'Yeni bilgisayar', requestDetail: 'Hasta kabul bilgisayarı çok yavaş çalışıyor.', status: 'pending', priority: 'high', submittedDate: d(-3) },
      { id: 's2', personnelId: 'p4', employeeName: 'Dr. Zeynep Şahin', requestCategory: 'Eğitim Talebi', requestTitle: 'Oftalmoloji Kongresi', requestDetail: 'Ulusal kongreye katılım talebi.', status: 'approved', priority: 'medium', submittedDate: d(-12) },
      { id: 's3', personnelId: 'p5', employeeName: 'Dr. Mehmet Arslan', requestCategory: 'Çalışma Saati Değişikliği', requestTitle: 'Vardiya değişikliği', requestDetail: 'Cuma öğleden sonraları için değişiklik.', status: 'rejected', priority: 'low', submittedDate: d(-20) },
    ],
  };
}

// Builds the full demo dataset relative to `today`. Pure and deterministic for a
// given day so tests (and "reset demo data") are reproducible.
export function createSeed(today = new Date()) {
  const rand = createRandom(Number(format(today, 'yyyyMMdd')));
  const personnel = personnelData.map(p => ({ ...p }));
  const doctors = personnel.filter(p => p.role === 'Doktor');
  const patients = createPatients(rand, startOfMonth(subMonths(today, HISTORY_MONTHS)), today);
  const appointments = createAppointments(rand, today, patients, doctors);

  return {
    personnel,
    patients,
    appointments,
    transactions: createTransactions(rand, today, appointments),
    inventory: createInventory(rand, today),
    ...createRequests(today),
  };
}
