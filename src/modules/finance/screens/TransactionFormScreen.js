import React, { useState } from 'react';
import { View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import ChipGroup from '../../../shared/components/Chip';
import DateField from '../../../shared/components/DateField';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormSection } from '../../../shared/components/FormScreen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import SelectField from '../../../shared/components/SelectField';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { toISODate } from '../../../shared/utils/date';
import { formatCurrency } from '../../../shared/utils/format';

const TYPES = [
  { value: 'income', label: 'Gelir / Tahsilat' },
  { value: 'expense', label: 'Gider' },
];

export function validateTransaction(form) {
  const errors = {};
  const amount = Number(form.amount);
  if (!form.amount || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Tutar 0’dan büyük olmalı.';
  else if (amount > 10000000) errors.amount = 'Tutar çok yüksek.';
  if (!form.category) errors.category = 'Kategori seçin.';
  if (!form.date) errors.date = 'Tarih seçin.';
  if (form.type === 'expense' && !form.description.trim()) errors.description = 'Gider için açıklama girin.';
  return errors;
}

export default function TransactionFormScreen({ route, navigation }) {
  const { transactions, patients, addTransaction, updateTransaction } = useAppData();
  const toast = useToast();
  const haptics = useHaptics();
  const styles = useStyles(makeStyles);
  const existing = transactions.find(t => t.id === route.params?.id);
  const [form, setForm] = useState(() =>
    existing
      ? { ...existing, amount: String(existing.amount) }
      : {
          type: route.params?.type || 'income',
          amount: '',
          category: route.params?.type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
          date: toISODate(new Date()),
          clinicId: CLINICS[0].id,
          patientId: route.params?.patientId,
          method: PAYMENT_METHODS[0],
          status: 'paid',
          description: '',
        }
  );
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const isIncome = form.type === 'income';
  const patient = patients.find(p => p.id === form.patientId);

  const changeType = type =>
    setForm(f => ({ ...f, type, category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0], patientId: type === 'income' ? f.patientId : undefined }));

  const submit = () => {
    const nextErrors = validateTransaction(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const record = {
      ...form,
      amount: Math.round(Number(form.amount)),
      description: form.description.trim() || (patient ? `${patient.name} · ${form.category}` : form.category),
      clinicId: patient && !existing ? patient.clinicId : form.clinicId,
    };
    if (existing) updateTransaction(record);
    else addTransaction(record);
    haptics.success();
    toast.show(`${isIncome ? 'Tahsilat' : 'Gider'} kaydedildi · ${formatCurrency(record.amount)}`);
    navigation.goBack();
  };

  return (
    <FormScreen title={existing ? 'İşlemi Düzenle' : isIncome ? 'Yeni Tahsilat' : 'Yeni Gider'} onCancel={navigation.goBack} onSubmit={submit}>
      {!existing ? <SegmentedControl options={TYPES} value={form.type} onChange={changeType} style={styles.segment} /> : null}

      <View style={styles.amountBox}>
        <AppText variant="caption" color="tertiary">
          TUTAR
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="display" color={isIncome ? 'success' : 'danger'}>
            ₺
          </AppText>
          <FormField
            value={form.amount}
            onChangeText={v => set('amount')(v.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            style={styles.flex}
            inputStyle={styles.amountInput}
            accessibilityLabel="Tutar"
            autoFocus={!existing}
            error={errors.amount}
          />
        </View>
      </View>

      <FormSection title="Detaylar">
        <FieldLabel label="Kategori" required />
        <ChipGroup
          options={isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
          value={form.category}
          onChange={set('category')}
          style={styles.chips}
        />
        {isIncome ? (
          <SelectField
            label="Hasta"
            placeholder="Hasta seçin (isteğe bağlı)"
            icon="user"
            value={form.patientId}
            options={[...patients]
              .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              .map(p => ({ value: p.id, label: p.name, description: p.phone, leading: <Avatar name={p.name} size={32} /> }))}
            onChange={set('patientId')}
          />
        ) : null}
        <DateField label="Tarih" required value={form.date} onChange={set('date')} maximumDate={toISODate(new Date())} error={errors.date} />
        <FormField
          label="Açıklama"
          required={!isIncome}
          placeholder={isIncome ? 'Otomatik oluşturulur' : 'Örn. Ekim ayı kira'}
          value={form.description}
          onChangeText={set('description')}
          error={errors.description}
        />
      </FormSection>

      <FormSection title="Ödeme">
        <FieldLabel label="Yöntem" />
        <ChipGroup options={PAYMENT_METHODS} value={form.method} onChange={set('method')} style={styles.chips} />
        {isIncome ? (
          <>
            <FieldLabel label="Durum" />
            <ChipGroup
              options={[
                { value: 'paid', label: 'Ödendi' },
                { value: 'pending', label: 'Bekliyor (alacak)', tone: 'warning' },
              ]}
              value={form.status}
              onChange={set('status')}
              style={styles.chips}
            />
          </>
        ) : null}
        {!patient ? (
          <>
            <FieldLabel label="Klinik" />
            <ChipGroup options={CLINICS.map(c => ({ value: c.id, label: c.city }))} value={form.clinicId} onChange={set('clinicId')} style={styles.chips} />
          </>
        ) : null}
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  segment: { marginBottom: 16 },
  amountBox: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 16,
    marginBottom: 18,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amountInput: { fontFamily: t.fonts.bold, fontSize: 30, paddingVertical: 6 },
  chips: { marginBottom: 16 },
});
