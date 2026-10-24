import React, { useMemo, useState } from 'react';
import { Alert, SectionList, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import Screen from '../../../shared/components/Screen';
import SearchBar from '../../../shared/components/SearchBar';
import { useToast } from '../../../shared/components/Toast';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { formatDate } from '../../../shared/utils/date';
import { matchesSearch } from '../../../shared/utils/format';
import TransactionRow from '../components/TransactionRow';

const TYPE_FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'income', label: 'Gelir' },
  { value: 'expense', label: 'Gider' },
  { value: 'pending', label: 'Bekleyen', tone: 'warning' },
];

// Groups by month, newest first: [{ title: 'Ekim 2026', total, data }]
export function groupByMonth(list) {
  const groups = new Map();
  [...list]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(t => {
      const key = t.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    });
  return [...groups.entries()].map(([key, data]) => ({
    key,
    title: formatDate(`${key}-01`, 'MMMM yyyy'),
    total: data.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    data,
  }));
}

export default function TransactionsScreen({ route, navigation }) {
  const { transactions, updateTransaction, removeTransaction } = useAppData();
  const { format } = useMoney();
  const toast = useToast();
  const styles = useStyles(makeStyles);
  const [filter, setFilter] = useState(route.params?.status === 'pending' ? 'pending' : 'all');
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const list = transactions.filter(
      t =>
        (filter === 'all' || (filter === 'pending' ? t.status === 'pending' : t.type === filter)) &&
        matchesSearch(query, t.description, t.category, t.method)
    );
    return groupByMonth(list);
  }, [transactions, filter, query]);

  const onPress = t => {
    const buttons = [{ text: 'Kapat', style: 'cancel' }];
    if (t.status === 'pending') {
      buttons.push({
        text: 'Tahsil edildi',
        onPress: () => {
          updateTransaction({ id: t.id, status: 'paid' });
          toast.show(`${format(t.amount)} tahsil edildi`);
        },
      });
    }
    if (t.patientId) buttons.push({ text: 'Hasta dosyası', onPress: () => navigation.navigate('PatientDetail', { id: t.patientId }) });
    if (!t.appointmentId) {
      buttons.push({ text: 'Düzenle', onPress: () => navigation.navigate('TransactionForm', { id: t.id, type: t.type }) });
      buttons.push({
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          removeTransaction(t.id);
          toast.show('İşlem silindi', { tone: 'info' });
        },
      });
    }
    Alert.alert(t.description || t.category, `${formatDate(t.date, 'd MMMM yyyy')} · ${format(t.amount)} · ${t.method || ''}`, buttons);
  };

  const pendingTotal = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  return (
    <Screen
      title="İşlemler"
      subtitle={filter === 'pending' ? `Toplam alacak ${format(pendingTotal)}` : undefined}
      onBack={navigation.goBack}
      scroll={false}
      right={<IconButton icon="plus" onPress={() => navigation.navigate('TransactionForm', { type: 'income' })} accessibilityLabel="İşlem ekle" />}
    >
      <View style={styles.controls}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Açıklama veya kategori ara" />
        <ChipGroup scroll options={TYPE_FILTERS} value={filter} onChange={setFilter} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={t => t.id}
        stickySectionHeadersEnabled
        initialNumToRender={20}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <AppText variant="smallMedium" color="secondary">
              {section.title}
            </AppText>
            <AppText variant="smallMedium" color={section.total >= 0 ? 'success' : 'danger'}>
              {section.total >= 0 ? '+' : '−'}
              {format(Math.abs(section.total))}
            </AppText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <TransactionRow transaction={item} divider={index < section.data.length - 1} onPress={() => onPress(item)} />
        )}
        ListEmptyComponent={<EmptyState icon="credit-card" title="İşlem bulunamadı" />}
      />
    </Screen>
  );
}

const makeStyles = t => ({
  controls: { paddingHorizontal: t.spacing.screen, gap: 12, marginBottom: 4 },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: t.colors.background,
    paddingTop: 14,
    paddingBottom: 4,
  },
});
