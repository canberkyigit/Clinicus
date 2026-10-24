import React, { useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import ChipGroup from '../../../shared/components/Chip';
import DateField from '../../../shared/components/DateField';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormRow, FormSection } from '../../../shared/components/FormScreen';
import SelectField from '../../../shared/components/SelectField';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { daysBetweenInclusive } from '../../../shared/utils/date';
import { LEAVE_TYPES } from '../data/requestsData';

export function validateLeave(form) {
  const errors = {};
  if (!form.personnelId) errors.personnelId = 'Personel seçin.';
  if (!form.startDate) errors.startDate = 'Başlangıç seçin.';
  if (!form.endDate) errors.endDate = 'Bitiş seçin.';
  else if (form.startDate && daysBetweenInclusive(form.startDate, form.endDate) === null) {
    errors.endDate = 'Bitiş, başlangıçtan önce olamaz.';
  }
  if (!form.reason.trim()) errors.reason = 'İzin sebebini belirtin.';
  return errors;
}

export default function LeaveRequestFormScreen({ navigation }) {
  const { personnel, addLeaveRequest } = useAppData();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const haptics = useHaptics();
  const [form, setForm] = useState({ personnelId: undefined, requestType: LEAVE_TYPES[0], startDate: '', endDate: '', reason: '', detail: '' });
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const days = daysBetweenInclusive(form.startDate, form.endDate);

  const submit = () => {
    const nextErrors = validateLeave(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const person = personnel.find(p => p.id === form.personnelId);
    addLeaveRequest({ ...form, reason: form.reason.trim(), detail: form.detail.trim(), employeeName: person.name });
    haptics.success();
    toast.show('İzin talebi gönderildi');
    navigation.goBack();
  };

  return (
    <FormScreen title="İzin Talebi" onCancel={navigation.goBack} onSubmit={submit} submitLabel="Gönder">
      <FormSection title="Talep">
        <SelectField
          label="Personel"
          required
          icon="user"
          placeholder="Personel seçin"
          value={form.personnelId}
          options={personnel.map(p => ({ value: p.id, label: p.name, description: p.role, leading: <Avatar uri={p.avatar} name={p.name} size={32} /> }))}
          onChange={set('personnelId')}
          error={errors.personnelId}
        />
        <FieldLabel label="İzin türü" />
        <ChipGroup options={LEAVE_TYPES} value={form.requestType} onChange={set('requestType')} style={styles.chips} />
      </FormSection>

      <FormSection title="Tarih">
        <FormRow>
          <DateField
            label="Başlangıç"
            required
            value={form.startDate}
            onChange={date => setForm(f => ({ ...f, startDate: date, endDate: f.endDate && f.endDate < date ? date : f.endDate }))}
            error={errors.startDate}
          />
          <DateField label="Bitiş" required value={form.endDate} minimumDate={form.startDate} onChange={set('endDate')} error={errors.endDate} />
        </FormRow>
        {days ? (
          <View style={styles.duration}>
            <Feather name="clock" size={16} color={colors.primary} />
            <AppText variant="bodyMedium" color="brand">
              Toplam {days} gün
            </AppText>
          </View>
        ) : null}
      </FormSection>

      <FormSection title="Açıklama">
        <FormField label="Sebep" required placeholder="Kısaca belirtin" value={form.reason} onChangeText={set('reason')} error={errors.reason} maxLength={120} />
        <FormField label="Detay" placeholder="İsteğe bağlı" value={form.detail} onChangeText={set('detail')} multiline maxLength={500} />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = t => ({
  chips: { marginBottom: 16 },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.colors.primaryMuted,
    borderRadius: t.radius.md,
    padding: 12,
    marginBottom: 14,
  },
});
