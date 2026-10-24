import React, { useState } from 'react';
import Avatar from '../../../shared/components/Avatar';
import ChipGroup from '../../../shared/components/Chip';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormSection } from '../../../shared/components/FormScreen';
import SelectField from '../../../shared/components/SelectField';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { PRIORITY } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { SPECIAL_CATEGORIES } from '../data/requestsData';

export function validateSpecial(form) {
  const errors = {};
  if (!form.personnelId) errors.personnelId = 'Personel seçin.';
  if (form.requestTitle.trim().length < 3) errors.requestTitle = 'Başlık en az 3 karakter olmalı.';
  return errors;
}

export default function SpecialRequestFormScreen({ navigation }) {
  const { personnel, addSpecialRequest } = useAppData();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const haptics = useHaptics();
  const [form, setForm] = useState({
    personnelId: undefined,
    requestCategory: SPECIAL_CATEGORIES[0],
    priority: 'medium',
    requestTitle: '',
    requestDetail: '',
  });
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));

  const submit = () => {
    const nextErrors = validateSpecial(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const person = personnel.find(p => p.id === form.personnelId);
    addSpecialRequest({ ...form, requestTitle: form.requestTitle.trim(), requestDetail: form.requestDetail.trim(), employeeName: person.name });
    haptics.success();
    toast.show('Talep oluşturuldu');
    navigation.goBack();
  };

  return (
    <FormScreen title="Özel Talep" onCancel={navigation.goBack} onSubmit={submit} submitLabel="Gönder">
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
        <FieldLabel label="Kategori" />
        <ChipGroup options={SPECIAL_CATEGORIES} value={form.requestCategory} onChange={set('requestCategory')} style={styles.chips} />
        <FieldLabel label="Öncelik" />
        <ChipGroup
          options={Object.entries(PRIORITY).map(([value, meta]) => ({ value, label: meta.label, tone: meta.tone }))}
          value={form.priority}
          onChange={set('priority')}
          style={styles.chips}
        />
      </FormSection>
      <FormSection title="Detay">
        <FormField label="Başlık" required placeholder="Örn. Yeni bilgisayar" value={form.requestTitle} onChangeText={set('requestTitle')} error={errors.requestTitle} maxLength={80} />
        <FormField label="Açıklama" placeholder="İsteğe bağlı" value={form.requestDetail} onChangeText={set('requestDetail')} multiline maxLength={500} />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = () => ({
  chips: { marginBottom: 16 },
});
