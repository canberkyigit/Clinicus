import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { parseISODate, toISODate } from '../../../shared/utils/date';

export const PERIODS = [
  { value: 'month', label: 'Bu Ay' },
  { value: 'lastMonth', label: 'Geçen Ay' },
  { value: 'year', label: 'Bu Yıl' },
];

// Returns the ISO range for a period plus the equivalent previous range used
// for "vs. previous period" comparisons.
export function periodRange(period, today = new Date()) {
  switch (period) {
    case 'lastMonth': {
      const ref = subMonths(today, 1);
      return range(startOfMonth(ref), endOfMonth(ref), startOfMonth(subMonths(ref, 1)), endOfMonth(subMonths(ref, 1)));
    }
    case 'year':
      return range(startOfYear(today), today, startOfYear(subYears(today, 1)), subYears(today, 1));
    case 'month':
    default:
      // Month-to-date vs. the same days of the previous month.
      return range(startOfMonth(today), today, startOfMonth(subMonths(today, 1)), subMonths(today, 1));
  }
}

function range(start, end, prevStart, prevEnd) {
  return {
    start: toISODate(start),
    end: toISODate(end),
    prevStart: toISODate(prevStart),
    prevEnd: toISODate(prevEnd),
  };
}

export function inRange(list, start, end) {
  return list.filter(t => t.date >= start && t.date <= end);
}

const sum = list => list.reduce((s, t) => s + t.amount, 0);

export function summarize(transactions) {
  const income = transactions.filter(t => t.type === 'income');
  const expense = transactions.filter(t => t.type === 'expense');
  const incomeTotal = sum(income);
  const collected = sum(income.filter(t => t.status === 'paid'));
  const expenseTotal = sum(expense.filter(t => t.status === 'paid'));
  return {
    income: incomeTotal,
    collected,
    receivable: incomeTotal - collected,
    expense: expenseTotal,
    net: collected - expenseTotal,
    collectionRate: incomeTotal ? Math.round((collected / incomeTotal) * 100) : 0,
    count: transactions.length,
  };
}

export function groupSum(transactions, keyFn) {
  const totals = new Map();
  transactions.forEach(t => {
    const key = keyFn(t);
    totals.set(key, (totals.get(key) || 0) + t.amount);
  });
  return [...totals.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

// Daily totals between two ISO dates (inclusive).
export function dailySeries(transactions, startIso, endIso, type = 'income') {
  const totals = {};
  transactions.forEach(t => {
    if (t.type === type && t.date >= startIso && t.date <= endIso) totals[t.date] = (totals[t.date] || 0) + t.amount;
  });
  const points = [];
  for (let d = parseISODate(startIso); toISODate(d) <= endIso; d = addDays(d, 1)) {
    const iso = toISODate(d);
    points.push({ key: iso, label: format(d, 'd'), value: totals[iso] || 0 });
  }
  return points;
}

// Monthly totals for the last `months` months ending with `today`'s month.
export function monthlySeries(transactions, months, today = new Date(), type = 'income') {
  const totals = {};
  transactions.forEach(t => {
    if (t.type === type) {
      const key = t.date.slice(0, 7);
      totals[key] = (totals[key] || 0) + t.amount;
    }
  });
  const first = startOfMonth(subMonths(today, months - 1));
  return Array.from({ length: months }, (_, i) => {
    const d = addMonths(first, i);
    const key = format(d, 'yyyy-MM');
    return { key, label: format(d, 'MMM', { locale: tr }), value: totals[key] || 0 };
  });
}

export function patientBalance(transactions, patientId) {
  const own = transactions.filter(t => t.type === 'income' && t.patientId === patientId);
  return {
    total: sum(own),
    paid: sum(own.filter(t => t.status === 'paid')),
    due: sum(own.filter(t => t.status === 'pending')),
  };
}

export function transactionsToCsv(transactions) {
  const header = 'Tarih;Tür;Kategori;Açıklama;Tutar;Durum;Ödeme';
  const rows = transactions.map(t =>
    [
      t.date,
      t.type === 'income' ? 'Gelir' : 'Gider',
      t.category,
      (t.description || '').replace(/;/g, ','),
      t.amount,
      t.status === 'paid' ? 'Ödendi' : 'Bekliyor',
      t.method || '',
    ].join(';')
  );
  return [header, ...rows].join('\n');
}
