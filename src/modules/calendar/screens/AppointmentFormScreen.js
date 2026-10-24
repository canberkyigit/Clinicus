import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/Chip';
import DateField from '../../../shared/components/DateField';
import FormField, { FieldLabel } from '../../../shared/components/FormField';
import FormScreen, { FormSection } from '../../../shared/components/FormScreen';
import SelectField from '../../../shared/components/SelectField';
import { useToast } from '../../../shared/components/Toast';
import { useAppData } from '../../../shared/context/AppDataContext';
import { clinicCity } from '../../../shared/data/clinics';
import { APPOINTMENT_TYPES, TIME_SLOTS } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { parseISODate, toISODate } from '../../../shared/utils/date';
import { busySlots } from '../data/appointmentSelectors';

export function validateAppointment(form, busy) {
  const errors = {};
  if (!form.patientId) errors.patientId = 'Hasta seçin.';
  if (!form.doctorId) errors.doctorId = 'Hekim seçin.';
  if (!form.date) errors.date = 'Tarih seçin.';
  else if (parseISODate(form.date).getDay() === 0) errors.date = 'Pazar günleri klinikler kapalı.';
  if (!form.time) errors.time = 'Saat seçin.';
  else if (busy.has(form.time)) errors.time = 'Hekimin bu saatte başka randevusu var.';
  if (form.fee !== '' && (!/^\d+$/.test(String(form.fee)) || Number(form.fee) > 100000)) errors.fee = 'Geçerli bir ücret girin.';
  return errors;
}

export default function AppointmentFormScreen({ route, navigation }) {
  const { appointments, patients, personnel, addAppointment, updateAppointment } = useAppData();
  const toast = useToast();
  const haptics = useHaptics();
  const styles = useStyles(makeStyles);
  const params = route.params || {};
  const existing = appointments.find(a => a.id === params.id);
  const isEdit = !!existing;

  const [form, setForm] = useState(() =>
    existing
      ? { ...existing, fee: String(existing.fee ?? '') }
      : {
          patientId: params.patientId,
          doctorId: params.doctorId,
          date: params.date || toISODate(new Date()),
          time: params.time,
          type: APPOINTMENT_TYPES[0].value,
          fee: String(APPOINTMENT_TYPES[0].fee),
          notes: '',
        }
  );
  const [errors, setErrors] = useState({});
  const [feeTouched, setFeeTouched] = useState(isEdit);

  // A patient created from this form comes back via route params.
  useEffect(() => {
    if (params.patientId) setForm(f => ({ ...f, patientId: params.patientId }));
  }, [params.patientId]);

  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const doctors = personnel.filter(p => p.role === 'Doktor' && p.status !== 'Pasif');
  const doctor = personnel.find(p => p.id === form.doctorId);
  const busy = useMemo(
    () => (form.doctorId && form.date ? busySlots(appointments, { doctorId: form.doctorId, date: form.date, excludeId: existing?.id }) : new Set()),
    [appointments, form.doctorId, form.date, existing?.id]
  );
  const isToday = form.date === toISODate(new Date());
  const nowTime = new Date().toTimeString().slice(0, 5);

  const patientOptions = useMemo(
    () =>
      [...patients]
        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        .map(p => ({ value: p.id, label: p.name, description: p.phone, leading: <Avatar name={p.name} size={34} /> })),
    [patients]
  );
  const doctorOptions = doctors.map(d => ({
    value: d.id,
    label: d.name,
    description: `${d.specialty || 'Hekim'} · ${clinicCity(d.clinicId)}${d.status === 'İzinli' ? ' · İzinli' : ''}`,
    leading: <Avatar uri={d.avatar} name={d.name} size={34} />,
  }));

  const selectType = value => {
    const type = APPOINTMENT_TYPES.find(t => t.value === value);
    setForm(f => ({ ...f, type: value, fee: feeTouched ? f.fee : String(type.fee) }));
  };

  const submit = () => {
    const nextErrors = validateAppointment(form, busy);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      haptics.error();
      return;
    }
    const patient = patients.find(p => p.id === form.patientId);
    const type = APPOINTMENT_TYPES.find(t => t.value === form.type);
    const record = {
      ...form,
      fee: Number(form.fee) || 0,
      duration: type?.duration || 30,
      patientName: patient.name,
      doctorName: doctor.name,
      clinicId: doctor.clinicId,
      notes: form.notes.trim(),
    };
    if (isEdit) updateAppointment(record);
    else addAppointment({ ...record, status: 'scheduled' });
    haptics.success();
    toast.show(isEdit ? 'Randevu güncellendi' : `Randevu oluşturuldu · ${form.time}`);
    navigation.goBack();
  };

  return (
    <FormScreen title={isEdit ? 'Randevuyu Düzenle' : 'Yeni Randevu'} onCancel={navigation.goBack} onSubmit={submit} submitLabel={isEdit ? 'Kaydet' : 'Oluştur'}>
      <FormSection title="Hasta ve hekim">
        <SelectField
          label="Hasta"
          required
          placeholder="Hasta seçin"
          icon="user"
          value={form.patientId}
          options={patientOptions}
          onChange={set('patientId')}
          error={errors.patientId}
          footer={
            <Button
              title="Yeni hasta ekle"
              icon="user-plus"
              variant="outline"
              style={styles.footerButton}
              onPress={() => navigation.navigate('PatientForm', { returnTo: 'AppointmentForm' })}
            />
          }
        />
        <SelectField
          label="Hekim"
          required
          placeholder="Hekim seçin"
          icon="activity"
          value={form.doctorId}
          options={doctorOptions}
          onChange={id => setForm(f => ({ ...f, doctorId: id, time: undefined }))}
          error={errors.doctorId}
        />
        {doctor?.status === 'İzinli' ? (
          <AppText variant="small" color="warning" style={styles.note}>
            Seçilen hekim şu anda izinli görünüyor.
          </AppText>
        ) : null}
      </FormSection>

      <FormSection title="Zaman">
        <DateField
          label="Tarih"
          required
          value={form.date}
          minimumDate={isEdit ? undefined : toISODate(new Date())}
          onChange={date => setForm(f => ({ ...f, date, time: undefined }))}
          error={errors.date}
        />
        <FieldLabel label="Saat" required />
        {!form.doctorId ? (
          <AppText variant="small" color="tertiary" style={styles.note}>
            Uygun saatleri görmek için önce hekim seçin.
          </AppText>
        ) : (
          <View style={styles.slots}>
            {TIME_SLOTS.map(slot => {
              const taken = busy.has(slot);
              const past = isToday && slot < nowTime && !isEdit;
              const disabled = taken || past;
              const selected = form.time === slot;
              return (
                <Pressable
                  key={slot}
                  disabled={disabled}
                  onPress={() => {
                    haptics.selection();
                    set('time')(slot);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`${slot}${taken ? ', dolu' : ''}`}
                  style={[styles.slot, selected && styles.slotSelected, disabled && styles.slotDisabled]}
                >
                  <AppText
                    variant="smallMedium"
                    color={selected ? 'onPrimary' : disabled ? 'tertiary' : 'primary'}
                    style={taken && styles.strike}
                  >
                    {slot}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}
        {errors.time ? (
          <AppText variant="small" color="danger" style={styles.note}>
            {errors.time}
          </AppText>
        ) : null}
        {form.doctorId ? (
          <AppText variant="caption" color="tertiary" style={styles.note}>
            {TIME_SLOTS.length - busy.size} boş saat · üstü çizili saatler dolu
          </AppText>
        ) : null}
      </FormSection>

      <FormSection title="Detaylar">
        <FieldLabel label="Randevu türü" />
        <ChipGroup options={APPOINTMENT_TYPES.map(t => t.value)} value={form.type} onChange={selectType} style={styles.chips} />
        <FormField
          label="Ücret (₺)"
          icon="credit-card"
          value={form.fee}
          onChangeText={v => {
            setFeeTouched(true);
            set('fee')(v.replace(/\D/g, ''));
          }}
          keyboardType="number-pad"
          error={errors.fee}
        />
        <FormField label="Notlar" placeholder="Şikayet, hazırlık notu..." value={form.notes} onChangeText={set('notes')} multiline maxLength={500} />
      </FormSection>
    </FormScreen>
  );
}

const makeStyles = t => ({
  footerButton: { marginTop: 12 },
  note: { marginTop: -6, marginBottom: 12 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  slot: {
    width: '22.5%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  slotSelected: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  slotDisabled: { backgroundColor: t.colors.surfaceAlt, borderColor: 'transparent' },
  strike: { textDecorationLine: 'line-through' },
  chips: { marginBottom: 16 },
});
