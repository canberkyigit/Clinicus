import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Badge from '../../../shared/components/Badge';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import ProgressBar from '../../../shared/components/ProgressBar';
import Screen from '../../../shared/components/Screen';
import SearchBar from '../../../shared/components/SearchBar';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { CLINICS, clinicCity } from '../../../shared/data/clinics';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { matchesSearch } from '../../../shared/utils/format';

const ALL = 'all';

export function stockLevel(item) {
  if (item.quantity === 0) return { label: 'Tükendi', tone: 'danger' };
  if (item.quantity <= item.minQuantity) return { label: 'Kritik', tone: 'warning' };
  return { label: 'Yeterli', tone: 'success' };
}

export default function InventoryScreen({ navigation }) {
  const { inventory, adjustInventory } = useAppData();
  const { format } = useMoney();
  const styles = useStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [clinicId, setClinicId] = useState(ALL);
  const [level, setLevel] = useState(ALL);

  const scoped = useMemo(() => inventory.filter(i => clinicId === ALL || i.clinicId === clinicId), [inventory, clinicId]);
  const critical = scoped.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length;
  const empty = scoped.filter(i => i.quantity === 0).length;
  const value = scoped.reduce((s, i) => s + i.quantity * (i.unitCost || 0), 0);

  const filtered = useMemo(
    () =>
      scoped
        .filter(i => {
          if (level === 'low') return i.quantity <= i.minQuantity;
          if (level === 'empty') return i.quantity === 0;
          return true;
        })
        .filter(i => matchesSearch(query, i.name, i.category))
        // Most urgent first.
        .sort((a, b) => a.quantity / (a.minQuantity || 1) - b.quantity / (b.minQuantity || 1)),
    [scoped, level, query]
  );

  return (
    <Screen
      title="Stok"
      onBack={navigation.goBack}
      scroll={false}
      right={<IconButton icon="plus" onPress={() => navigation.navigate('InventoryForm')} accessibilityLabel="Stok kalemi ekle" />}
    >
      <View style={styles.controls}>
        <View style={styles.summary}>
          <Summary label="Kalem" value={scoped.length} />
          <Summary label="Kritik" value={critical} tone="warning" />
          <Summary label="Tükendi" value={empty} tone="danger" />
          <Summary label="Değer" value={format(value, { compact: true })} />
        </View>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Malzeme ara" />
        <ChipGroup
          scroll
          options={[{ value: ALL, label: 'Tüm klinikler' }, ...CLINICS.map(c => ({ value: c.id, label: c.city }))]}
          value={clinicId}
          onChange={setClinicId}
        />
        <ChipGroup
          scroll
          options={[
            { value: ALL, label: 'Tümü' },
            { value: 'low', label: 'Kritik seviye', tone: 'warning', count: critical + empty },
            { value: 'empty', label: 'Tükenenler', tone: 'danger', count: empty },
          ]}
          value={level}
          onChange={setLevel}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <InventoryRow
            item={item}
            onPress={() => navigation.navigate('InventoryForm', { id: item.id })}
            onAdjust={delta => adjustInventory(item.id, delta)}
          />
        )}
        ListEmptyComponent={<EmptyState icon="package" title="Kalem bulunamadı" />}
      />
    </Screen>
  );
}

function Summary({ label, value, tone }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="h3" color={tone || 'primary'} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="caption" color="tertiary">
        {label}
      </AppText>
    </View>
  );
}

function InventoryRow({ item, onPress, onAdjust }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const haptics = useHaptics();
  const level = stockLevel(item);
  const step = item.unit === 'adet' ? 10 : 1;
  const adjust = delta => {
    haptics.selection();
    onAdjust(delta);
  };

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="bodyMedium">{item.name}</AppText>
          <AppText variant="small" color="secondary">
            {item.category} · {clinicCity(item.clinicId)}
          </AppText>
        </View>
        <Badge label={level.label} tone={level.tone} dot />
      </View>
      <ProgressBar value={item.quantity} max={item.minQuantity * 3} tone={level.tone} style={styles.bar} />
      <View style={styles.row}>
        <AppText variant="small" color="secondary" style={styles.flex}>
          Min. {item.minQuantity} {item.unit}
        </AppText>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => adjust(-step)}
            disabled={item.quantity === 0}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} azalt`}
            style={[styles.stepBtn, item.quantity === 0 && styles.disabled]}
          >
            <Feather name="minus" size={16} color={colors.text} />
          </Pressable>
          <AppText variant="bodyMedium" style={styles.qty} accessibilityLabel={`${item.quantity} ${item.unit}`}>
            {item.quantity} <AppText variant="small" color="tertiary">{item.unit}</AppText>
          </AppText>
          <Pressable onPress={() => adjust(step)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${item.name} artır`} style={styles.stepBtn}>
            <Feather name="plus" size={16} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  controls: { paddingHorizontal: t.spacing.screen, gap: 10, marginBottom: 8 },
  summary: {
    flexDirection: 'row',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingVertical: 12,
  },
  list: { paddingHorizontal: t.spacing.screen, paddingBottom: 40 },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  pressed: { backgroundColor: t.colors.surfacePressed },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { marginVertical: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: t.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  qty: { minWidth: 64, textAlign: 'center' },
});
