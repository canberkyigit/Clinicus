import React, { useState } from 'react';
import ChipGroup from '../../../shared/components/Chip';
import DateField from '../../../shared/components/DateField';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormRow, FormSection } from '../../../shared/components/FormScreen';
import SelectField from '../../../shared/components/SelectField';
import TagInput from '../../../shared/components/TagInput';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { BLOOD_TYPES, GENDERS, INSURANCE_TYPES } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { toISODate } from '../../../shared/utils/date';
import { EMAIL_REGEX } from '../../../shared/utils/format';

const ALLERGY_SUGGESTIONS = ['Penisilin', 'Aspirin', 'Lateks', 'Polen', 'Fıstık'];
const CONDITION_SUGGESTIONS = ['Hipertansiyon', 'Diyabet', 'Astım', 'Migren', 'Kolesterol'];

const EMPTY = {
  firstName: '',
  lastName: '',
  gender: GENDERS[0],
  birthDate: '',
  phone: '',
  email: '',
  insurance: INSURANCE_TYPES[0],
  bloodType: undefined,
  clinicId: CLINICS[0].id,
  allergies: [],
  conditions: [],
  notes: '',
};

export function validatePatient(form) {
  const errors = {};
  if (form.firstName.trim().length < 2) errors.firstName = 'Ad en az 2 karakter olmalı.';
  if (form.lastName.trim().length < 2) errors.lastName = 'Soyad en az 2 karakter olmalı.';
  if (form.phone.replace(/\D/g, '').length < 10) errors.phone = 'Geçerli bir telefon girin (en az 10 hane).';
  if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) errors.email = 'Geçerli bir e-posta girin.';
  if (form.birthDate && form.birthDate > toISODate(new Date())) errors.birthDate = 'Doğum tarihi gelecekte olamaz.';
  return errors;
}

export default function PatientFormScreen({ route, navigation }) {
  const { patients, addPatient, updatePatient } = useAppData();
  const toast = useToast();
  const haptics = useHaptics();
  const styles = useStyles(makeStyles);
  const existing = patients.find(p => p.id === route.params?.id);
  const returnTo = route.params?.returnTo;
  const [form, setForm] = useState(() => ({ ...EMPTY, ...existing }));
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));

  const submit = () => {
    const nextErrors = validatePatient(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const record = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    haptics.success();
    if (existing) {
      updatePatient(record);
      toast.show('Hasta bilgileri güncellendi');
      navigation.goBack();
      return;
    }
    const id = addPatient(record);
    toast.show(`${record.name} eklendi`);
    if (returnTo) navigation.navigate({ name: returnTo, params: { patientId: id }, merge: true });
    else navigation.replace('PatientDetail', { id });
  };

  return (
    <FormScreen title={existing ? 'Hastayı Düzenle' : 'Yeni Hasta'} onCancel={navigation.goBack} onSubmit={submit} submitLabel={existing ? 'Kaydet' : 'Ekle'}>
      <FormSection title="Kimlik">
        <FormRow>
          <FormField style={styles.flex} label="Ad" required value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} autoCapitalize="words" />
          <FormField style={styles.flex} label="Soyad" required value={form.lastName} onChangeText={set('lastName')} error={errors.lastName} autoCapitalize="words" />
        </FormRow>
        <FieldLabel label="Cinsiyet" />
        <ChipGroup options={GENDERS} value={form.gender} onChange={set('gender')} style={styles.chips} />
        <DateField label="Doğum tarihi" value={form.birthDate} onChange={set('birthDate')} maximumDate={toISODate(new Date())} error={errors.birthDate} />
      </FormSection>

      <FormSection title="İletişim">
        <FormField label="Telefon" required icon="phone" placeholder="0532 123 45 67" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <FormField label="E-posta" icon="mail" placeholder="ornek@mail.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      </FormSection>

      <FormSection title="Sağlık">
        <FieldLabel label="Sigorta" />
        <ChipGroup options={INSURANCE_TYPES} value={form.insurance} onChange={set('insurance')} style={styles.chips} />
        <SelectField
          label="Kan grubu"
          placeholder="Belirtilmedi"
          value={form.bloodType}
          options={BLOOD_TYPES.map(b => ({ value: b, label: b }))}
          onChange={set('bloodType')}
          searchable={false}
        />
        <TagInput label="Alerjiler" tone="danger" value={form.allergies} onChange={set('allergies')} suggestions={ALLERGY_SUGGESTIONS} placeholder="Alerji ekle" />
        <TagInput label="Kronik hastalıklar" tone="purple" value={form.conditions} onChange={set('conditions')} suggestions={CONDITION_SUGGESTIONS} placeholder="Hastalık ekle" />
      </FormSection>

      <FormSection title="Diğer">
        <FieldLabel label="Kayıtlı olduğu klinik" />
        <ChipGroup options={CLINICS.map(c => ({ value: c.id, label: c.city }))} value={form.clinicId} onChange={set('clinicId')} style={styles.chips} />
        <FormField label="Genel not" value={form.notes} onChangeText={set('notes')} multiline maxLength={500} />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = () => ({
  flex: { flex: 1 },
  chips: { marginBottom: 16 },
});
