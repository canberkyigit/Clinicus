import React, { useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import Card from '../../../shared/components/Card';
import IconButton from '../../../shared/components/IconButton';
import KpiCard from '../../../shared/components/KpiCard';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import AreaChart from '../../../shared/components/charts/AreaChart';
import BarChart from '../../../shared/components/charts/BarChart';
import DonutChart from '../../../shared/components/charts/DonutChart';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { formatDate } from '../../../shared/utils/date';
import { formatCurrency, formatPercent } from '../../../shared/utils/format';
import { buildReport } from '../data/reportSelectors';

const RANGES = [
  { value: 3, label: '3 Ay' },
  { value: 6, label: '6 Ay' },
  { value: 12, label: '12 Ay' },
];

export default function ReportsScreen({ navigation }) {
  const { appointments, patients, personnel } = useAppData();
  const { format } = useMoney();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [months, setMonths] = useState(6);
  const report = useMemo(() => buildReport({ appointments, patients, personnel }, months), [appointments, patients, personnel, months]);

  const share = () =>
    Share.share({
      title: 'Klinik Raporu',
      message: [
        `Clinicus · Operasyon Raporu`,
        `${formatDate(report.start)} – ${formatDate(report.end)}`,
        '',
        `Toplam randevu: ${report.total}`,
        `Tamamlanma: %${report.completionRate}`,
        `Gelmeme: %${report.noShowRate}`,
        `İptal: %${report.cancelRate}`,
        `Ortalama ücret: ${formatCurrency(report.averageFee)}`,
        `Yeni hasta: ${report.newPatients}`,
        '',
        'Uzmanlıklara göre:',
        ...report.bySpecialty.map(s => `  ${s.label}: ${s.value}`),
      ].join('\n'),
    }).catch(() => {});

  return (
    <Screen
      title="Raporlar"
      subtitle={`${formatDate(report.start, 'd MMM yyyy')} – ${formatDate(report.end, 'd MMM yyyy')}`}
      onBack={navigation.goBack}
      right={<IconButton icon="share" onPress={share} accessibilityLabel="Raporu paylaş" />}
    >
      <SegmentedControl options={RANGES} value={months} onChange={setMonths} style={styles.segment} />

      <View style={styles.row}>
        <KpiCard icon="calendar" tone="info" label="Gerçekleşen randevu" value={String(report.total)} caption={`${report.completed} tamamlandı`} />
        <KpiCard icon="check-circle" label="Tamamlanma oranı" value={formatPercent(report.completionRate)} />
      </View>
      <View style={styles.row}>
        <KpiCard icon="user-x" tone="warning" label="Gelmeme oranı" value={formatPercent(report.noShowRate)} caption={`İptal: ${formatPercent(report.cancelRate)}`} />
        <KpiCard icon="tag" tone="purple" label="Ortalama ücret" value={format(report.averageFee)} caption={`${report.newPatients} yeni hasta`} />
      </View>

      <Card title="Aylık randevular">
        <BarChart
          data={report.monthly}
          series={[
            { label: 'Tamamlanan', color: colors.primary },
            { label: 'İptal / Gelmedi', color: colors.warning },
          ]}
        />
      </Card>

      <Card title="Randevu geliri">
        <AreaChart
          data={report.monthly.map(m => ({ key: m.key, label: m.label, tooltipLabel: m.tooltipLabel, value: m.revenue }))}
          formatValue={v => format(v)}
          color={colors.info}
          labelEvery={months > 6 ? 2 : 1}
        />
      </Card>

      <Card title="Uzmanlıklara göre">
        <DonutChart data={report.bySpecialty} centerValue={String(report.completed)} centerLabel="muayene" />
      </Card>

      <Card title="Randevu türleri">
        <DonutChart data={report.byType} centerValue={String(report.byType.length)} centerLabel="tür" />
      </Card>

      <Card title="En yoğun saatler">
        <BarChart data={report.hours} series={[{ label: 'Randevu sayısı', color: colors.purple }]} height={140} />
      </Card>

      <Card title="En yoğun günler">
        <BarChart data={report.weekdays} series={[{ label: 'Randevu sayısı', color: colors.info }]} height={140} />
      </Card>
    </Screen>
  );
}

const makeStyles = () => ({
  segment: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
});
