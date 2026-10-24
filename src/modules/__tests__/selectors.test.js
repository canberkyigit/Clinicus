import { createSeed } from '../../shared/data/seed';
import { donutSegments, niceMax, smoothPath } from '../../shared/components/charts/chartUtils';
import { busySlots, freeSlots, rankBy, statusCounts, upcoming } from '../calendar/data/appointmentSelectors';
import {
  dailySeries,
  groupSum,
  monthlySeries,
  patientBalance,
  periodRange,
  summarize,
  transactionsToCsv,
} from '../finance/data/financeSelectors';
import { buildReport } from '../reports/data/reportSelectors';
import { buildNotifications } from '../notifications/data/buildNotifications';
import { clinicStats } from '../clinics/data/clinicStats';
import { globalSearch } from '../search/screens/SearchScreen';
import { groupAlphabetically } from '../patients/screens/PatientsScreen';
import { groupByMonth } from '../finance/screens/TransactionsScreen';
import { stockLevel } from '../inventory/screens/InventoryScreen';

const NOW = new Date(2026, 9, 24, 12, 0);
const seed = createSeed(NOW);

describe('appointment selectors', () => {
  const list = [
    { id: '1', date: '2026-10-26', time: '09:00', doctorId: 'p1', status: 'scheduled' },
    { id: '2', date: '2026-10-26', time: '09:30', doctorId: 'p1', status: 'cancelled' },
    { id: '3', date: '2026-10-26', time: '10:00', doctorId: 'p2', status: 'scheduled' },
    { id: '4', date: '2026-10-20', time: '10:00', doctorId: 'p1', status: 'noshow' },
  ];

  it('treats cancelled slots as free and can exclude the edited appointment', () => {
    expect([...busySlots(list, { doctorId: 'p1', date: '2026-10-26' })]).toEqual(['09:00']);
    expect(busySlots(list, { doctorId: 'p1', date: '2026-10-26', excludeId: '1' }).size).toBe(0);
    expect(freeSlots(list, { doctorId: 'p1', date: '2026-10-26' })).not.toContain('09:00');
  });

  it('lists upcoming scheduled appointments in order', () => {
    expect(upcoming(list, NOW).map(a => a.id)).toEqual(['1', '3']);
    expect(upcoming(list, NOW, 1)).toHaveLength(1);
  });

  it('counts statuses including no-shows', () => {
    expect(statusCounts(list)).toEqual({ total: 4, scheduled: 2, cancelled: 1, completed: 0, noshow: 1 });
  });

  it('ranks without cancelled appointments', () => {
    expect(rankBy(list, a => a.doctorId)).toEqual([
      { key: 'p1', count: 2 },
      { key: 'p2', count: 1 },
    ]);
  });
});

describe('finance selectors', () => {
  const tx = [
    { id: 'a', type: 'income', amount: 1000, status: 'paid', date: '2026-10-02', clinicId: 'ankara', patientId: 'h1' },
    { id: 'b', type: 'income', amount: 500, status: 'pending', date: '2026-10-03', clinicId: 'izmir', patientId: 'h1' },
    { id: 'c', type: 'expense', amount: 300, status: 'paid', date: '2026-10-03', clinicId: 'ankara', category: 'Kira' },
    { id: 'd', type: 'income', amount: 200, status: 'paid', date: '2026-09-15', clinicId: 'ankara' },
  ];

  it('builds period ranges with comparison windows', () => {
    expect(periodRange('month', NOW)).toEqual({ start: '2026-10-01', end: '2026-10-24', prevStart: '2026-09-01', prevEnd: '2026-09-24' });
    expect(periodRange('lastMonth', NOW)).toMatchObject({ start: '2026-09-01', end: '2026-09-30' });
    expect(periodRange('year', NOW)).toMatchObject({ start: '2026-01-01', prevStart: '2025-01-01' });
  });

  it('summarizes income, receivables and net', () => {
    expect(summarize(tx.slice(0, 3))).toEqual({
      income: 1500,
      collected: 1000,
      receivable: 500,
      expense: 300,
      net: 700,
      collectionRate: 67,
      count: 3,
    });
  });

  it('groups, series and balances', () => {
    expect(groupSum(tx.filter(t => t.type === 'income'), t => t.clinicId)).toEqual([
      { key: 'ankara', value: 1200 },
      { key: 'izmir', value: 500 },
    ]);
    const days = dailySeries(tx, '2026-10-01', '2026-10-03');
    expect(days.map(d => d.value)).toEqual([0, 1000, 500]);
    const months = monthlySeries(tx, 2, NOW);
    expect(months.map(m => m.value)).toEqual([200, 1500]);
    expect(patientBalance(tx, 'h1')).toEqual({ total: 1500, paid: 1000, due: 500 });
  });

  it('exports CSV with escaped descriptions', () => {
    const csv = transactionsToCsv([{ ...tx[0], category: 'Muayene', description: 'a;b', method: 'Kart' }]);
    expect(csv.split('\n')).toEqual(['Tarih;Tür;Kategori;Açıklama;Tutar;Durum;Ödeme', '2026-10-02;Gelir;Muayene;a,b;1000;Ödendi;Kart']);
  });
});

describe('reports', () => {
  it('computes rates that add up', () => {
    const report = buildReport(seed, 6, NOW);
    expect(report.monthly).toHaveLength(6);
    expect(report.completionRate + report.noShowRate + report.cancelRate).toBeCloseTo(100, 0);
    expect(report.bySpecialty.reduce((s, x) => s + x.value, 0)).toBe(report.completed);
    expect(report.averageFee).toBeGreaterThan(0);
  });
});

describe('notifications', () => {
  it('derives alerts and respects read state', () => {
    const state = { ...seed, readNotificationIds: [] };
    const all = buildNotifications(state, NOW);
    expect(all.some(n => n.id.startsWith('req-'))).toBe(true);
    expect(all.every(n => n.route?.name)).toBe(true);

    const read = buildNotifications({ ...state, readNotificationIds: [all[0].id] }, NOW);
    expect(read.find(n => n.id === all[0].id).read).toBe(true);
    // Unread items are listed first.
    expect(read[read.length - 1].read).toBe(true);
  });
});

describe('clinic stats and search helpers', () => {
  it('summarizes each clinic', () => {
    const stats = clinicStats(seed, NOW);
    expect(stats).toHaveLength(4);
    expect(stats.reduce((s, c) => s + c.staff.length, 0)).toBe(seed.personnel.length);
  });

  it('searches across entities with a minimum length', () => {
    expect(globalSearch(seed, 'a')).toEqual([]);
    const results = globalSearch(seed, 'Ahmet');
    expect(results.map(r => r.key)).toEqual(expect.arrayContaining(['personnel']));
    results.forEach(r => expect(r.data.length).toBeLessThanOrEqual(5));
  });

  it('groups patients alphabetically with Turkish ordering', () => {
    const sections = groupAlphabetically([{ name: 'Şule A' }, { name: 'Ali B' }, { name: 'Çiğdem C' }, { name: 'Can D' }]);
    expect(sections.map(s => s.title)).toEqual(['A', 'C', 'Ç', 'Ş']);
  });

  it('groups transactions by month with net totals', () => {
    const groups = groupByMonth([
      { id: '1', date: '2026-10-02', type: 'income', amount: 100 },
      { id: '2', date: '2026-10-05', type: 'expense', amount: 30 },
      { id: '3', date: '2026-09-01', type: 'income', amount: 10 },
    ]);
    expect(groups.map(g => [g.title, g.total])).toEqual([
      ['Ekim 2026', 70],
      ['Eylül 2026', 10],
    ]);
  });

  it('classifies stock levels', () => {
    expect(stockLevel({ quantity: 0, minQuantity: 5 }).label).toBe('Tükendi');
    expect(stockLevel({ quantity: 5, minQuantity: 5 }).label).toBe('Kritik');
    expect(stockLevel({ quantity: 6, minQuantity: 5 }).label).toBe('Yeterli');
  });
});

describe('chart utils', () => {
  it('rounds axis maxima', () => {
    expect([8730, 120, 0, 2400].map(niceMax)).toEqual([10000, 200, 1, 2500]);
  });

  it('splits donut segments', () => {
    const segs = donutSegments([
      { label: 'a', value: 3 },
      { label: 'b', value: 1 },
    ]);
    expect(segs.map(s => s.fraction)).toEqual([0.75, 0.25]);
    expect(segs[1].end).toBeCloseTo(Math.PI * 2);
    expect(donutSegments([{ label: 'z', value: 0 }])).toEqual([]);
  });

  it('builds smooth paths', () => {
    expect(smoothPath([{ x: 0, y: 0 }], 10)).toEqual({ line: '', area: '' });
    const { line, area } = smoothPath([{ x: 0, y: 5 }, { x: 10, y: 0 }], 10);
    expect(line.startsWith('M0,5 C')).toBe(true);
    expect(area.endsWith('Z')).toBe(true);
  });
});
