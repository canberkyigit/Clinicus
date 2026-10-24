import React, { useState } from 'react';
import { Alert } from 'react-native';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/Chip';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormRow, FormSection } from '../../../shared/components/FormScreen';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { INVENTORY_CATEGORIES } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { toISODate } from '../../../shared/utils/date';

const UNITS = ['adet', 'kutu', 'paket', 'şişe', 'litre'];
const NUMERIC = ['quantity', 'minQuantity', 'unitCost'];

export function validateInventory(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Malzeme adı girin.';
  NUMERIC.forEach(key => {
    if (form[key] === '' && key !== 'unitCost') errors[key] = 'Zorunlu alan.';
    else if (form[key] !== '' && !/^\d+$/.test(String(form[key]))) errors[key] = 'Pozitif tam sayı girin.';
  });
  return errors;
}

export default function InventoryFormScreen({ route, navigation }) {
  const { inventory, addInventoryItem, updateInventoryItem, removeInventoryItem } = useAppData();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const haptics = useHaptics();
  const existing = inventory.find(i => i.id === route.params?.id);
  const [form, setForm] = useState(() =>
    existing
      ? { ...existing, quantity: String(existing.quantity), minQuantity: String(existing.minQuantity), unitCost: String(existing.unitCost ?? '') }
      : { name: '', category: INVENTORY_CATEGORIES[0], clinicId: CLINICS[0].id, unit: UNITS[0], quantity: '', minQuantity: '', unitCost: '' }
  );
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const setNumber = key => value => set(key)(value.replace(/\D/g, ''));

  const submit = () => {
    const nextErrors = validateInventory(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const record = {
      ...form,
      name: form.name.trim(),
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity),
      unitCost: form.unitCost === '' ? 0 : Number(form.unitCost),
      updatedAt: toISODate(new Date()),
    };
    if (existing) updateInventoryItem(record);
    else addInventoryItem(record);
    haptics.success();
    toast.show(existing ? 'Stok kalemi güncellendi' : 'Stok kalemi eklendi');
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert('Kalemi sil', `${existing.name} stoktan kaldırılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          removeInventoryItem(existing.id);
          toast.show('Stok kalemi silindi', { tone: 'info' });
          navigation.goBack();
        },
      },
    ]);

  return (
    <FormScreen
      title={existing ? 'Stok Kalemi' : 'Yeni Stok Kalemi'}
      onCancel={navigation.goBack}
      onSubmit={submit}
      footerExtra={existing ? <Button title="Kalemi Sil" icon="trash-2" variant="dangerSoft" onPress={confirmDelete} /> : null}
    >
      <FormSection title="Malzeme">
        <FormField label="Ad" required placeholder="Örn. Muayene eldiveni" value={form.name} onChangeText={set('name')} error={errors.name} />
        <FieldLabel label="Kategori" />
        <ChipGroup options={INVENTORY_CATEGORIES} value={form.category} onChange={set('category')} style={styles.chips} />
        <FieldLabel label="Klinik" />
        <ChipGroup options={CLINICS.map(c => ({ value: c.id, label: c.city }))} value={form.clinicId} onChange={set('clinicId')} style={styles.chips} />
      </FormSection>
      <FormSection title="Miktar">
        <FieldLabel label="Birim" />
        <ChipGroup options={UNITS} value={form.unit} onChange={set('unit')} style={styles.chips} />
        <FormRow>
          <FormField style={styles.flex} label="Mevcut" required value={form.quantity} onChangeText={setNumber('quantity')} keyboardType="number-pad" error={errors.quantity} />
          <FormField
            style={styles.flex}
            label="Minimum"
            required
            value={form.minQuantity}
            onChangeText={setNumber('minQuantity')}
            keyboardType="number-pad"
            error={errors.minQuantity}
            hint="Altına düşünce uyarı"
          />
        </FormRow>
        <FormField label="Birim maliyet (₺)" value={form.unitCost} onChangeText={setNumber('unitCost')} keyboardType="number-pad" error={errors.unitCost} />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = () => ({
  flex: { flex: 1 },
  chips: { marginBottom: 16 },
});
