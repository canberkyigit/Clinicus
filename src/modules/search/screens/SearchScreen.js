import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import EmptyState from '../../../shared/components/EmptyState';
import ListItem from '../../../shared/components/ListItem';
import SearchBar from '../../../shared/components/SearchBar';
import { useAppData } from '../../../shared/context/AppDataContext';
import { clinicCity } from '../../../shared/data/clinics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { relativeDay } from '../../../shared/utils/date';
import { formatCurrency, matchesSearch } from '../../../shared/utils/format';
import { sortAppointments } from '../../calendar/data/appointmentSelectors';

const LIMIT = 5;

// Searches every entity at once; each section shows up to LIMIT results.
export function globalSearch(data, query) {
  if (query.trim().length < 2) return [];
  const sections = [
    {
      key: 'patients',
      title: 'Hastalar',
      data: data.patients.filter(p => matchesSearch(query, p.name, p.phone, p.email)),
    },
    {
      key: 'appointments',
      title: 'Randevular',
      data: sortAppointments(data.appointments.filter(a => matchesSearch(query, a.patientName, a.doctorName)), 'desc'),
    },
    {
      key: 'personnel',
      title: 'Personel',
      data: data.personnel.filter(p => matchesSearch(query, p.name, p.specialty, p.role)),
    },
    {
      key: 'inventory',
      title: 'Stok',
      data: data.inventory.filter(i => matchesSearch(query, i.name, i.category)),
    },
    {
      key: 'transactions',
      title: 'İşlemler',
      data: data.transactions.filter(t => matchesSearch(query, t.description, t.category)),
    },
  ];
  return sections
    .filter(s => s.data.length)
    .map(s => ({ ...s, total: s.data.length, data: s.data.slice(0, LIMIT) }));
}

export default function SearchScreen({ navigation }) {
  const data = useAppData();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const sections = useMemo(() => globalSearch(data, query), [data, query]);

  const renderItem = ({ item, section, index }) => {
    const divider = index < section.data.length - 1;
    switch (section.key) {
      case 'patients':
        return (
          <ListItem
            leading={<Avatar name={item.name} size={38} />}
            title={item.name}
            subtitle={item.phone}
            chevron
            divider={divider}
            onPress={() => navigation.replace('PatientDetail', { id: item.id })}
          />
        );
      case 'appointments':
        return (
          <ListItem
            icon="calendar"
            iconTone="info"
            title={item.patientName}
            subtitle={`${relativeDay(item.date, new Date(), 'd MMM yyyy')} ${item.time} · ${item.doctorName}`}
            chevron
            divider={divider}
            onPress={() => navigation.replace('AppointmentDetail', { id: item.id })}
          />
        );
      case 'personnel':
        return (
          <ListItem
            leading={<Avatar uri={item.avatar} name={item.name} size={38} />}
            title={item.name}
            subtitle={[item.role, item.specialty].filter(Boolean).join(' · ')}
            chevron
            divider={divider}
            onPress={() => navigation.replace('PersonnelProfile', { id: item.id })}
          />
        );
      case 'inventory':
        return (
          <ListItem
            icon="package"
            iconTone="purple"
            title={item.name}
            subtitle={`${item.quantity} ${item.unit} · ${clinicCity(item.clinicId)}`}
            chevron
            divider={divider}
            onPress={() => navigation.replace('InventoryForm', { id: item.id })}
          />
        );
      default:
        return (
          <ListItem
            icon={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
            iconTone={item.type === 'income' ? 'success' : 'danger'}
            title={item.description}
            subtitle={`${relativeDay(item.date, new Date(), 'd MMM yyyy')} · ${formatCurrency(item.amount)}`}
            divider={divider}
            onPress={item.patientId ? () => navigation.replace('PatientDetail', { id: item.patientId }) : undefined}
          />
        );
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Hasta, randevu, personel, stok..." autoFocus style={styles.flex} />
        <Pressable onPress={navigation.goBack} hitSlop={8} accessibilityRole="button">
          <AppText variant="bodyMedium" color="brand">
            Kapat
          </AppText>
        </Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.id || String(i)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="caption" color="tertiary" style={styles.sectionTitle}>
            {section.title.toLocaleUpperCase('tr-TR')} · {section.total}
          </AppText>
        )}
        renderItem={renderItem}
        ListEmptyComponent={
          query.trim().length < 2 ? (
            <EmptyState icon="search" title="Aramaya başlayın" message="En az 2 karakter yazın. Tüm modüllerde aynı anda aranır." />
          ) : (
            <EmptyState icon="search" title="Sonuç bulunamadı" message={`"${query}" ile eşleşen kayıt yok.`} />
          )
        }
      />
    </View>
  );
}

const makeStyles = t => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: t.spacing.screen, marginBottom: 8 },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
  sectionTitle: { marginTop: 18, marginBottom: 4 },
});
