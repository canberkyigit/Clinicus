import React, { useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import IconButton from '../../../shared/components/IconButton';
import KpiCard from '../../../shared/components/KpiCard';
import ProgressBar from '../../../shared/components/ProgressBar';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import AreaChart from '../../../shared/components/charts/AreaChart';
import BarChart from '../../../shared/components/charts/BarChart';
import DonutChart from '../../../shared/components/charts/DonutChart';
import { useAppData, useLookup, useMoney } from '../../../shared/context/AppDataContext';
import { clinicCity } from '../../../shared/data/clinics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { formatDate } from '../../../shared/utils/date';
import { formatCurrency, formatPercent, percentChange } from '../../../shared/utils/format';
import TransactionRow from '../components/TransactionRow';
import {
  dailySeries,
  groupSum,
  inRange,
  monthlySeries,
  PERIODS,
  periodRange,
  summarize,
  transactionsToCsv,
} from '../data/financeSelectors';

export function buildReportText(summary, range, label) {
  return [
    `Clinicus · Finans Raporu (${label})`,
    `${formatDate(range.start)} – ${formatDate(range.end)}`,
    '',
    `Gelir: ${formatCurrency(summary.income)}`,
    `Tahsil edilen: ${formatCurrency(summary.collected)}`,
    `Alacak: ${formatCurrency(summary.receivable)}`,
    `Gider: ${formatCurrency(summary.expense)}`,
    `Net: ${formatCurrency(summary.net)}`,
    `Tahsilat oranı: %${summary.collectionRate}`,
  ].join('\n');
}

export default function FinanceScreen({ navigation }) {
  const { transactions } = useAppData();
  const personnel = useLookup('personnel');
  const { format, hidden, toggleHidden } = useMoney();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [period, setPeriod] = useState('month');

  const data = useMemo(() => {
    const range = periodRange(period);
    const current = inRange(transactions, range.start, range.end);
    const previous = inRange(transactions, range.prevStart, range.prevEnd);
    const income = current.filter(t => t.type === 'income');
    const monthlyExpense = monthlySeries(transactions, 12, new Date(), 'expense');
    return {
      range,
      current,
      summary: summarize(current),
      prev: summarize(previous),
      byClinic: groupSum(income, t => t.clinicId),
      byDoctor: groupSum(income.filter(t => t.doctorId), t => t.doctorId).slice(0, 5),
      byCategory: groupSum(current.filter(t => t.type === 'expense'), t => t.category),
      daily: dailySeries(transactions, range.start, range.end).map(p => ({ ...p, tooltipLabel: formatDate(p.key, 'd MMMM') })),
      prevDaily: dailySeries(transactions, range.prevStart, range.prevEnd),
      monthly: monthlySeries(transactions, 12).map((m, i) => ({ ...m, values: [m.value, monthlyExpense[i].value] })),
      recent: [...current].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    };
  }, [transactions, period]);

  const { summary, prev } = data;
  const maxClinic = Math.max(1, ...data.byClinic.map(c => c.value));
  const periodLabel = PERIODS.find(p => p.value === period).label;

  const share = async () => {
    const text = buildReportText(summary, data.range, periodLabel);
    const csv = transactionsToCsv([...data.current].sort((a, b) => a.date.localeCompare(b.date)));
    await Share.share({ title: 'Finans Raporu', message: `${text}\n\n--- İşlemler (CSV) ---\n${csv}` }).catch(() => {});
  };

  return (
    <Screen
      title="Finans"
      onBack={navigation.goBack}
      right={
        <>
          <IconButton icon={hidden ? 'eye-off' : 'eye'} onPress={toggleHidden} accessibilityLabel={hidden ? 'Değerleri göster' : 'Değerleri gizle'} />
          <IconButton icon="share" onPress={share} accessibilityLabel="Raporu paylaş" />
        </>
      }
    >
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} style={styles.segment} />

      <Card>
        <AppText variant="small" color="secondary">
          Net kâr · {periodLabel}
        </AppText>
        <View style={styles.netRow}>
          <AppText variant="display" color={summary.net >= 0 ? 'primary' : 'danger'}>
            {format(summary.net)}
          </AppText>
          <Delta value={percentChange(summary.net, prev.net)} />
        </View>
        <View style={styles.split}>
          <View style={styles.splitItem}>
            <View style={[styles.splitIcon, { backgroundColor: colors.successMuted }]}>
              <Feather name="arrow-down-left" size={15} color={colors.success} />
            </View>
            <View>
              <AppText variant="caption" color="tertiary">
                GELİR
              </AppText>
              <AppText variant="bodyMedium">{format(summary.income)}</AppText>
            </View>
          </View>
          <View style={styles.splitItem}>
            <View style={[styles.splitIcon, { backgroundColor: colors.dangerMuted }]}>
              <Feather name="arrow-up-right" size={15} color={colors.danger} />
            </View>
            <View>
              <AppText variant="caption" color="tertiary">
                GİDER
              </AppText>
              <AppText variant="bodyMedium">{format(summary.expense)}</AppText>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.kpis}>
        <KpiCard icon="percent" tone="info" label="Tahsilat oranı" value={formatPercent(summary.collectionRate)} caption={`${format(summary.collected, { compact: true })} tahsil edildi`} />
        <KpiCard
          icon="clock"
          tone="warning"
          label="Bekleyen alacak"
          value={format(summary.receivable, { compact: true })}
          caption="Görmek için dokunun"
          onPress={() => navigation.navigate('Transactions', { status: 'pending' })}
        />
      </View>

      <View style={styles.actions}>
        <Button title="Tahsilat" icon="plus" style={styles.flex} onPress={() => navigation.navigate('TransactionForm', { type: 'income' })} />
        <Button title="Gider" icon="minus" variant="secondary" style={styles.flex} onPress={() => navigation.navigate('TransactionForm', { type: 'expense' })} />
      </View>

      {period === 'year' ? (
        <Card title="Aylık gelir ve gider">
          <BarChart
            data={data.monthly}
            series={[
              { label: 'Gelir', color: colors.primary },
              { label: 'Gider', color: colors.danger },
            ]}
            formatValue={v => format(v, { compact: true })}
          />
        </Card>
      ) : (
        <Card title="Günlük gelir" right={<AppText variant="caption" color="tertiary">--- önceki dönem</AppText>}>
          <AreaChart
            data={data.daily}
            compareData={data.prevDaily}
            formatValue={v => format(v)}
            labelEvery={Math.ceil(data.daily.length / 6)}
          />
        </Card>
      )}

      <Card title="Klinik bazında gelir">
        {data.byClinic.map((c, i) => (
          <View key={c.key} style={[styles.barRow, i === data.byClinic.length - 1 && styles.last]}>
            <View style={styles.barLabel}>
              <AppText variant="bodyMedium">{clinicCity(c.key)}</AppText>
              <AppText variant="smallMedium">{format(c.value)}</AppText>
            </View>
            <ProgressBar value={c.value} max={maxClinic} />
          </View>
        ))}
      </Card>

      <Card title="Gider dağılımı">
        <DonutChart
          data={data.byCategory.map(c => ({ label: c.key, value: c.value }))}
          centerValue={format(summary.expense, { compact: true })}
          centerLabel="toplam"
        />
      </Card>

      <Card title="Hekim bazında gelir">
        {data.byDoctor.map((d, i) => (
          <View key={d.key} style={[styles.doctorRow, i < data.byDoctor.length - 1 && styles.divider]}>
            <AppText variant="caption" color="tertiary" style={styles.rank}>
              {i + 1}
            </AppText>
            <AppText variant="bodyMedium" style={styles.flex} numberOfLines={1}>
              {personnel[d.key]?.name || 'Silinmiş hekim'}
            </AppText>
            <AppText variant="bodyMedium" color="brand">
              {format(d.value)}
            </AppText>
          </View>
        ))}
      </Card>

      <Card title="Son işlemler" actionLabel="Tümü" onAction={() => navigation.navigate('Transactions')}>
        {data.recent.map((t, i) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            divider={i < data.recent.length - 1}
            onPress={t.patientId ? () => navigation.navigate('PatientDetail', { id: t.patientId }) : undefined}
          />
        ))}
      </Card>
    </Screen>
  );
}

function Delta({ value }) {
  const up = value >= 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <AppText variant="smallMedium" color={up ? 'success' : 'danger'}>
        {up ? '▲' : '▼'} {formatPercent(value)}
      </AppText>
    </View>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  segment: { marginBottom: 14 },
  netRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2, marginBottom: 14 },
  split: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: 14 },
  splitItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  splitIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpis: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  barRow: { gap: 8, marginBottom: 14 },
  last: { marginBottom: 0 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  rank: { width: 16 },
});
