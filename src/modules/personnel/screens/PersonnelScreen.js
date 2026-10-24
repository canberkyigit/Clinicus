import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import SearchBar from '../../../shared/components/SearchBar';
import { useAppData, useLookup } from '../../../shared/context/AppDataContext';
import { CLINICS, clinicCity } from '../../../shared/data/clinics';
import { PERSONNEL_STATUS_TONES, ROLES } from '../../../shared/data/constants';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { matchesSearch } from '../../../shared/utils/format';

const ALL = 'all';

export default function PersonnelScreen({ navigation }) {
  const { personnel } = useAppData();
  const byId = useLookup('personnel');
  const styles = useStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState(ALL);
  const [clinicId, setClinicId] = useState(ALL);

  const filtered = useMemo(
    () =>
      personnel
        .filter(
          p =>
            (role === ALL || p.role === role) &&
            (clinicId === ALL || p.clinicId === clinicId) &&
            matchesSearch(query, p.name, p.specialty, p.title)
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [personnel, query, role, clinicId]
  );

  const active = personnel.filter(p => p.status === 'Aktif').length;

  return (
    <Screen
      title="Personel"
      subtitle={`${active}/${personnel.length} aktif`}
      onBack={navigation.goBack}
      scroll={false}
      right={<IconButton icon="user-plus" onPress={() => navigation.navigate('PersonnelForm')} accessibilityLabel="Personel ekle" />}
    >
      <View style={styles.controls}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="İsim, uzmanlık veya unvan" accessibilityLabel="Personel ara" />
        <ChipGroup
          scroll
          options={[
            { value: ALL, label: 'Tümü', count: personnel.length },
            ...ROLES.map(r => ({ value: r, label: r, count: personnel.filter(p => p.role === r).length })),
          ]}
          value={role}
          onChange={setRole}
        />
        <ChipGroup
          scroll
          options={[{ value: ALL, label: 'Tüm klinikler' }, ...CLINICS.map(c => ({ value: c.id, label: c.city, tone: 'info' }))]}
          value={clinicId}
          onChange={setClinicId}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => (
          <ListItem
            leading={<Avatar uri={item.avatar} name={item.name} size={46} />}
            title={item.name}
            subtitle={[item.role, item.specialty, clinicCity(item.clinicId)].filter(Boolean).join(' · ')}
            meta={item.connectedToId && byId[item.connectedToId] ? `Ekip: ${byId[item.connectedToId].name}` : undefined}
            trailing={<Badge label={item.status} tone={PERSONNEL_STATUS_TONES[item.status]} dot />}
            chevron
            divider={index < filtered.length - 1}
            onPress={() => navigation.navigate('PersonnelProfile', { id: item.id })}
          />
        )}
        ListEmptyComponent={<EmptyState icon="users" title="Sonuç bulunamadı" message="Filtreleri değiştirmeyi deneyin." />}
      />
    </Screen>
  );
}

const makeStyles = t => ({
  controls: { paddingHorizontal: t.spacing.screen, gap: 10, marginBottom: 6 },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
});
