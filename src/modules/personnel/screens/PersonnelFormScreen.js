import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import ChipGroup from '../../../shared/components/Chip';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormRow, FormSection } from '../../../shared/components/FormScreen';
import TagInput from '../../../shared/components/TagInput';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { PERSONNEL_STATUS, PERSONNEL_STATUS_TONES, ROLES } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { EMAIL_REGEX } from '../../../shared/utils/format';

const EMPTY_FORM = {
  avatar: '',
  name: '',
  role: ROLES[0],
  clinicId: CLINICS[0].id,
  connectedToId: undefined,
  status: PERSONNEL_STATUS[0],
  graduation: '',
  yearsOfExperience: '',
  age: '',
  title: '',
  caseCount: '',
  specialty: '',
  languages: [],
  phone: '',
  email: '',
  bio: '',
};

const NUMERIC_FIELDS = {
  yearsOfExperience: { label: 'Deneyim', min: 0, max: 60 },
  age: { label: 'Yaş', min: 18, max: 80 },
  caseCount: { label: 'Vaka sayısı', min: 0, max: 1000000 },
};

export function toForm(person) {
  if (!person) return EMPTY_FORM;
  const form = { ...EMPTY_FORM, ...person };
  Object.keys(NUMERIC_FIELDS).forEach(key => {
    form[key] = person[key] === undefined || person[key] === null ? '' : String(person[key]);
  });
  form.languages = person.languages || [];
  return form;
}

export function fromForm(form) {
  const person = { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
  Object.keys(NUMERIC_FIELDS).forEach(key => {
    person[key] = form[key] === '' ? undefined : Number(form[key]);
  });
  if (person.role === 'Doktor') person.connectedToId = undefined;
  else person.caseCount = undefined;
  return person;
}

export function validatePersonnel(form) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Ad soyad en az 3 karakter olmalı.';
  if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) errors.email = 'Geçerli bir e-posta girin.';
  if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 10) errors.phone = 'Telefon en az 10 haneli olmalı.';
  Object.entries(NUMERIC_FIELDS).forEach(([key, rule]) => {
    if (form[key] === '') return;
    const n = Number(form[key]);
    if (!Number.isInteger(n) || n < rule.min || n > rule.max) {
      errors[key] = `${rule.label} ${rule.min}-${rule.max} arasında olmalı.`;
    }
  });
  return errors;
}

export default function PersonnelFormScreen({ route, navigation }) {
  const { personnel, addPersonnel, updatePersonnel } = useAppData();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const haptics = useHaptics();
  const existing = personnel.find(p => p.id === route.params?.id);
  const [form, setForm] = useState(() => toForm(existing));
  const [errors, setErrors] = useState({});
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const isDoctor = form.role === 'Doktor';
  const clinicDoctors = personnel.filter(d => d.role === 'Doktor' && d.clinicId === form.clinicId && d.id !== form.id);

  const pickImage = async fromCamera => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf seçebilmek için ayarlardan izin vermeniz gerekiyor.');
      return;
    }
    const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    const result = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]?.uri) set('avatar')(result.assets[0].uri);
  };

  const chooseImage = () => {
    const choices = ['Galeriden Seç', 'Fotoğraf Çek', ...(form.avatar ? ['Fotoğrafı Kaldır'] : []), 'Vazgeç'];
    const handle = index => {
      if (index === 0) pickImage(false);
      else if (index === 1) pickImage(true);
      else if (form.avatar && index === 2) set('avatar')('');
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: choices, cancelButtonIndex: choices.length - 1, destructiveButtonIndex: form.avatar ? 2 : undefined },
        handle
      );
    } else {
      Alert.alert('Profil fotoğrafı', undefined, choices.map((text, index) => ({ text, style: index === choices.length - 1 ? 'cancel' : undefined, onPress: () => handle(index) })));
    }
  };

  const submit = () => {
    const nextErrors = validatePersonnel(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const record = fromForm(form);
    haptics.success();
    if (existing) {
      updatePersonnel({ ...record, id: existing.id });
      toast.show('Personel güncellendi');
      navigation.goBack();
    } else {
      const id = addPersonnel(record);
      toast.show(`${record.name} eklendi`);
      navigation.replace('PersonnelProfile', { id });
    }
  };

  return (
    <FormScreen title={existing ? 'Personeli Düzenle' : 'Yeni Personel'} onCancel={navigation.goBack} onSubmit={submit} submitLabel={existing ? 'Kaydet' : 'Ekle'}>
      <Pressable onPress={chooseImage} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Profil fotoğrafı seç">
        <Avatar uri={form.avatar} name={form.name || '?'} size={96} />
        <View style={styles.camera}>
          <Feather name="camera" size={15} color={colors.onPrimary} />
        </View>
      </Pressable>

      <FormSection title="Temel bilgiler">
        <FormField label="Ad Soyad" required placeholder="Örn. Dr. Ayşe Yılmaz" value={form.name} onChangeText={set('name')} error={errors.name} />
        <FieldLabel label="Rol" />
        <ChipGroup options={ROLES} value={form.role} onChange={set('role')} style={styles.chips} />
        <FieldLabel label="Klinik" />
        <ChipGroup
          options={CLINICS.map(c => ({ value: c.id, label: c.city }))}
          value={form.clinicId}
          onChange={id => setForm(f => ({ ...f, clinicId: id, connectedToId: undefined }))}
          style={styles.chips}
        />
        {!isDoctor ? (
          <>
            <FieldLabel label="Bağlı olduğu hekim" />
            {clinicDoctors.length ? (
              <ChipGroup
                options={[{ value: undefined, label: 'Yok' }, ...clinicDoctors.map(d => ({ value: d.id, label: d.name }))]}
                value={form.connectedToId}
                onChange={set('connectedToId')}
                style={styles.chips}
              />
            ) : (
              <AppText variant="small" color="tertiary" style={styles.chips}>
                Bu klinikte kayıtlı hekim yok.
              </AppText>
            )}
          </>
        ) : null}
        <FieldLabel label="Durum" />
        <ChipGroup
          options={PERSONNEL_STATUS.map(s => ({ value: s, label: s, tone: PERSONNEL_STATUS_TONES[s] }))}
          value={form.status}
          onChange={set('status')}
          style={styles.chips}
        />
      </FormSection>

      <FormSection title="Mesleki bilgiler">
        <FormRow>
          <FormField style={styles.flex} label="Unvan" placeholder="Uzman, Doçent..." value={form.title} onChangeText={set('title')} />
          <FormField style={styles.flex} label="Uzmanlık" placeholder="Kardiyoloji" value={form.specialty} onChangeText={set('specialty')} />
        </FormRow>
        <FormField label="Mezuniyet" placeholder="Üniversite / Fakülte" value={form.graduation} onChangeText={set('graduation')} />
        <FormRow>
          <FormField style={styles.flex} label="Deneyim (yıl)" value={form.yearsOfExperience} onChangeText={set('yearsOfExperience')} keyboardType="number-pad" error={errors.yearsOfExperience} />
          <FormField style={styles.flex} label="Yaş" value={form.age} onChangeText={set('age')} keyboardType="number-pad" error={errors.age} />
        </FormRow>
        {isDoctor ? (
          <FormField label="Toplam vaka" value={form.caseCount} onChangeText={set('caseCount')} keyboardType="number-pad" error={errors.caseCount} />
        ) : null}
        <TagInput label="Diller" value={form.languages} onChange={set('languages')} suggestions={['Türkçe', 'İngilizce', 'Almanca', 'Arapça']} placeholder="Dil ekle" />
      </FormSection>

      <FormSection title="İletişim">
        <FormField label="Telefon" icon="phone" placeholder="0555 123 45 67" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <FormField label="E-posta" icon="mail" placeholder="ornek@klinik.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <FormField label="Açıklama" placeholder="Kısa biyografi" value={form.bio} onChangeText={set('bio')} multiline />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  chips: { marginBottom: 16 },
  avatar: { alignSelf: 'center', marginBottom: 18 },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.colors.background,
  },
});
