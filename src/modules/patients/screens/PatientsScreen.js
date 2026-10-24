import React, { useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { startOfMonth } from 'date-fns';
import AppText from '../../../shared/components/AppText';
import Badge from '../../../shared/components/Badge';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import Screen, { useTabBarPadding } from '../../../shared/components/Screen';
import SearchBar from '../../../shared/components/SearchBar';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { toISODate } from '../../../shared/utils/date';
import { matchesSearch } from '../../../shared/utils/format';
import PatientRow from '../components/PatientRow';

const FILTERS = ['all', 'new', 'debt', 'allergy'];
const FILTER_LABELS = { all: 'Tümü', new: 'Bu ay yeni', debt: 'Borçlu', allergy: 'Alerjili' };

export function groupAlphabetically(list) {
  const sections = {};
  list.forEach(p => {
    const letter = p.name.charAt(0).toLocaleUpperCase('tr-TR');
    (sections[letter] = sections[letter] || []).push(p);
  });
  return Object.keys(sections)
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .map(title => ({ title, data: sections[title].sort((a, b) => a.name.localeCompare(b.name, 'tr')) }));
}

export default function PatientsScreen({ navigation }) {
  const { patients, transactions } = useAppData();
  const { format } = useMoney();
  const styles = useStyles(makeStyles);
  const bottom = useTabBarPadding();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const dues = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type === 'income' && t.status === 'pending' && t.patientId) map[t.patientId] = (map[t.patientId] || 0) + t.amount;
    });
    return map;
  }, [transactions]);

  const monthStart = toISODate(startOfMonth(new Date()));
  const predicates = {
    all: () => true,
    new: p => p.createdAt >= monthStart,
    debt: p => dues[p.id] > 0,
    allergy: p => p.allergies?.length > 0,
  };

  const filtered = patients.filter(p => predicates[filter](p) && matchesSearch(query, p.name, p.phone, p.email));
  const sections = groupAlphabetically(filtered);

  return (
    <Screen
      title="Hastalar"
      subtitle={`${patients.length} kayıtlı hasta`}
      large
      scroll={false}
      right={<IconButton icon="user-plus" variant="primary" onPress={() => navigation.navigate('PatientForm')} accessibilityLabel="Yeni hasta" />}
    >
      <View style={styles.controls}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="İsim, telefon veya e-posta" />
        <ChipGroup
          scroll
          options={FILTERS.map(f => ({ value: f, label: FILTER_LABELS[f], count: patients.filter(predicates[f]).length }))}
          value={filter}
          onChange={setFilter}
          style={styles.chips}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={p => p.id}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: bottom }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <AppText variant="caption" color="tertiary">
              {section.title}
            </AppText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={styles.item}>
            <PatientRow
              patient={item}
              divider={index < section.data.length - 1}
              onPress={() => navigation.navigate('PatientDetail', { id: item.id })}
              trailing={dues[item.id] ? <Badge label={format(dues[item.id])} tone="warning" /> : null}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={query ? 'Eşleşen hasta yok' : 'Hasta bulunamadı'}
            message={query ? `"${query}" için sonuç bulunamadı.` : 'Filtreyi değiştirmeyi deneyin.'}
            actionLabel="Yeni hasta ekle"
            onAction={() => navigation.navigate('PatientForm')}
          />
        }
      />
    </Screen>
  );
}

const makeStyles = t => ({
  controls: { paddingHorizontal: t.spacing.screen, gap: 12, marginBottom: 6 },
  chips: { marginBottom: 4 },
  sectionHeader: {
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing.screen,
    paddingTop: 12,
    paddingBottom: 4,
  },
  item: { paddingHorizontal: t.spacing.screen },
});
