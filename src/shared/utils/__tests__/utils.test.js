import {
  addMinutesToTime,
  ageFrom,
  daysBetweenInclusive,
  formatDate,
  greetingForHour,
  parseISODate,
  relativeDay,
  toISODate,
} from '../date';
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  HIDDEN_VALUE,
  initials,
  matchesSearch,
  normalizeSearch,
  percentChange,
  phoneHref,
} from '../format';
import { createRandom } from '../random';

describe('date utils', () => {
  it('round-trips local ISO dates without timezone shifts', () => {
    const date = parseISODate('2025-01-15');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2025, 0, 15]);
    expect(toISODate(date)).toBe('2025-01-15');
  });

  it('handles empty and invalid input', () => {
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('not-a-date')).toBeNull();
    expect(formatDate(null)).toBe('');
  });

  it('formats dates in Turkish', () => {
    expect(formatDate('2025-07-01')).toBe('01.07.2025');
    expect(formatDate('2025-07-01', 'd MMMM')).toBe('1 Temmuz');
  });

  it('counts days inclusively and rejects reversed ranges', () => {
    expect(daysBetweenInclusive('2025-07-01', '2025-07-10')).toBe(10);
    expect(daysBetweenInclusive('2025-07-01', '2025-07-01')).toBe(1);
    expect(daysBetweenInclusive('2025-07-10', '2025-07-01')).toBeNull();
  });

  it('computes age around birthdays', () => {
    const now = new Date(2026, 9, 24);
    expect(ageFrom('2000-10-24', now)).toBe(26);
    expect(ageFrom('2000-10-25', now)).toBe(25);
    expect(ageFrom('', now)).toBeNull();
  });

  it('describes nearby days relatively', () => {
    const now = new Date(2026, 9, 24);
    expect(relativeDay('2026-10-24', now)).toBe('Bugün');
    expect(relativeDay('2026-10-25', now)).toBe('Yarın');
    expect(relativeDay('2026-10-23', now)).toBe('Dün');
    expect(relativeDay('2026-11-02', now, 'd MMM')).toBe('2 Kas');
  });

  it('adds minutes to clock times', () => {
    expect(addMinutesToTime('09:30', 30)).toBe('10:00');
    expect(addMinutesToTime('16:45', 60)).toBe('17:45');
  });

  it('greets by time of day', () => {
    expect([3, 9, 14, 20].map(greetingForHour)).toEqual(['İyi geceler', 'Günaydın', 'İyi günler', 'İyi akşamlar']);
  });
});

describe('format utils', () => {
  it('formats, compacts and hides currency', () => {
    expect(formatCurrency(12500)).toBe('₺12.500');
    expect(formatCurrency(12500, { compact: true })).toBe('₺12,5B');
    expect(formatCurrency(1250000, { compact: true })).toBe('₺1,3Mn');
    expect(formatCurrency(12500, { hidden: true })).toBe(HIDDEN_VALUE);
    expect(formatCompact(950)).toBe('950');
  });

  it('formats signed percentages', () => {
    expect(formatPercent(12.34)).toBe('%12,3');
    expect(formatPercent(-5, { signed: true })).toBe('-%5');
    expect(formatPercent(5, { signed: true })).toBe('+%5');
  });

  it('builds initials ignoring titles', () => {
    expect(initials('Dr. Ahmet Yılmaz')).toBe('AY');
    expect(initials('Doç. Dr. ilknur Şahin')).toBe('İŞ');
    expect(initials('')).toBe('?');
  });

  it('searches Turkish text case-insensitively', () => {
    expect(normalizeSearch('  İZMİR ')).toBe('izmir');
    expect(matchesSearch('ışık', 'IŞIK Klinik')).toBe(true);
    expect(matchesSearch('', 'anything')).toBe(true);
    expect(matchesSearch('xyz', 'abc', undefined)).toBe(false);
  });

  it('computes percent change safely', () => {
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(5, 0)).toBe(100);
    expect(percentChange(0, 0)).toBe(0);
  });

  it('builds tel links', () => {
    expect(phoneHref('0555 123 45 67')).toBe('tel:05551234567');
  });
});

describe('random', () => {
  it('is deterministic per seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a.next(), a.int(1, 10), a.sample([1, 2, 3, 4], 2)]).toEqual([b.next(), b.int(1, 10), b.sample([1, 2, 3, 4], 2)]);
  });

  it('samples without duplicates', () => {
    const sample = createRandom(7).sample([1, 2, 3, 4, 5], 5);
    expect(new Set(sample).size).toBe(5);
  });
});
