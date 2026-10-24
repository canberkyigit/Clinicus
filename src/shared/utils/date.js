import { format, differenceInCalendarDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

// Dates are stored as local "yyyy-MM-dd" strings. `new Date('2025-01-15')` parses
// as UTC midnight and shifts a day in negative offsets, so always go through here.
export function toISODate(date) {
  return format(date, 'yyyy-MM-dd');
}

export function parseISODate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function formatDate(value, pattern = 'dd.MM.yyyy') {
  const date = parseISODate(value);
  return date ? format(date, pattern, { locale: tr }) : '';
}

// Inclusive day count: a leave from Monday to Monday is 1 day. Returns null for
// missing or reversed ranges so callers can show validation errors.
export function daysBetweenInclusive(start, end) {
  const s = parseISODate(start);
  const e = parseISODate(end);
  if (!s || !e) return null;
  const diff = differenceInCalendarDays(e, s);
  return diff < 0 ? null : diff + 1;
}

export function ageFrom(birthIso, now = new Date()) {
  const birth = parseISODate(birthIso);
  if (!birth) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// "Bugün", "Yarın", "Dün" or a short date.
export function relativeDay(iso, now = new Date(), pattern = 'd MMM, EEE') {
  const date = parseISODate(iso);
  if (!date) return '';
  const diff = differenceInCalendarDays(date, now);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  return format(date, pattern, { locale: tr });
}

export function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function greetingForHour(hour) {
  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}
