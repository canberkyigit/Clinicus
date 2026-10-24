import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import FormField from '../../../shared/components/FormField';
import IconButton from '../../../shared/components/IconButton';
import InfoRow from '../../../shared/components/InfoRow';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { useToast } from '../../../shared/components/Toast';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { clinicName } from '../../../shared/data/clinics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { ageFrom, formatDate, relativeDay } from '../../../shared/utils/date';
import { phoneHref } from '../../../shared/utils/format';
import AppointmentCard from '../../calendar/components/AppointmentCard';
import { sortAppointments, upcoming } from '../../calendar/data/appointmentSelectors';
import TransactionRow from '../../finance/components/TransactionRow';
import { patientBalance } from '../../finance/data/financeSelectors';

const TABS = [
  { value: 'overview', label: 'Genel' },
  { value: 'visits', label: 'Randevular' },
  { value: 'payments', label: 'Ödemeler' },
];

export default function PatientDetailScreen({ route, navigation }) {
  const { patients, appointments, transactions, updatePatient, removePatient, updateTransaction } = useAppData();
  const { format } = useMoney();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles(makeStyles);
  const [tab, setTab] = useState('overview');
  const [note, setNote] = useState('');
  const patient = patients.find(p => p.id === route.params?.id);

  const visits = useMemo(
    () => (patient ? sortAppointments(appointments.filter(a => a.patientId === patient.id), 'desc') : []),
    [appointments, patient]
  );
  const payments = useMemo(
    () =>
      patient
        ? transactions.filter(t => t.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [transactions, patient]
  );

  if (!patient) {
    return (
      <Screen title="Hasta" onBack={navigation.goBack}>
        <EmptyState icon="user-x" title="Hasta bulunamadı" message="Bu kayıt silinmiş olabilir." />
      </Screen>
    );
  }

  const age = ageFrom(patient.birthDate);
  const balance = patientBalance(transactions, patient.id);
  const next = upcoming(visits, new Date(), 1)[0];
  const lastVisit = visits.find(v => v.status === 'completed');
  const completedCount = visits.filter(v => v.status === 'completed').length;
  const notes = Array.isArray(patient.noteLog) ? patient.noteLog : [];

  const addNote = () => {
    const text = note.trim();
    if (!text) return;
    updatePatient({ id: patient.id, noteLog: [{ id: Date.now().toString(36), text, date: new Date().toISOString() }, ...notes] });
    setNote('');
    toast.show('Not eklendi');
  };

  const collectAll = () => {
    payments.filter(t => t.status === 'pending').forEach(t => updateTransaction({ id: t.id, status: 'paid' }));
    toast.show(`${format(balance.due)} tahsil edildi`);
  };

  const confirmDelete = () =>
    Alert.alert('Hastayı sil', `${patient.name} kaydı silinecek. Geçmiş randevular raporlarda kalır, planlı randevular silinir.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          removePatient(patient.id);
          toast.show('Hasta kaydı silindi', { tone: 'info' });
        },
      },
    ]);

  const contact = [
    { icon: 'phone', label: 'Ara', disabled: !patient.phone, onPress: () => Linking.openURL(phoneHref(patient.phone)) },
    { icon: 'message-circle', label: 'SMS', disabled: !patient.phone, onPress: () => Linking.openURL(phoneHref(patient.phone).replace('tel:', 'sms:')) },
    { icon: 'mail', label: 'E-posta', disabled: !patient.email, onPress: () => Linking.openURL(`mailto:${patient.email}`) },
    { icon: 'calendar', label: 'Randevu', onPress: () => navigation.navigate('AppointmentForm', { patientId: patient.id }) },
  ];

  return (
    <Screen
      title="Hasta Dosyası"
      onBack={navigation.goBack}
      right={<IconButton icon="edit-2" onPress={() => navigation.navigate('PatientForm', { id: patient.id })} accessibilityLabel="Düzenle" />}
    >
      <View style={styles.hero}>
        <Avatar name={patient.name} size={76} />
        <AppText variant="h1" align="center">
          {patient.name}
        </AppText>
        <AppText variant="body" color="secondary" align="center">
          {[age !== null && `${age} yaş`, patient.gender, patient.bloodType].filter(Boolean).join(' · ')}
        </AppText>
        <View style={styles.badges}>
          <Badge label={patient.insurance === 'Yok' ? 'Sigortasız' : patient.insurance} tone="info" />
          {patient.allergies?.length ? <Badge label="Alerji" tone="danger" dot /> : null}
          {balance.due > 0 ? <Badge label={`Borç ${format(balance.due)}`} tone="warning" /> : null}
        </View>
      </View>

      <View style={styles.contact}>
        {contact.map(c => (
          <Pressable
            key={c.label}
            disabled={c.disabled}
            onPress={() => Promise.resolve(c.onPress()).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel={c.label}
            style={({ pressed }) => [styles.contactItem, (pressed || c.disabled) && styles.dimmed]}
          >
            <Feather name={c.icon} size={19} color={colors.primary} />
            <AppText variant="caption" color="secondary">
              {c.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.stats}>
        <Stat label="Ziyaret" value={completedCount} />
        <Stat label="Son ziyaret" value={lastVisit ? relativeDay(lastVisit.date, new Date(), 'd MMM yy') : '—'} />
        <Stat label="Toplam ödeme" value={format(balance.paid, { compact: true })} />
      </View>

      <SegmentedControl
        options={TABS.map(t => ({ ...t, badge: t.value === 'payments' && balance.due > 0 ? '!' : undefined }))}
        value={tab}
        onChange={setTab}
        style={styles.tabs}
      />

      {tab === 'overview' ? (
        <>
          {next ? (
            <Card title="Sıradaki randevu">
              <AppointmentCard appointment={next} showDate showPatient={false} onPress={() => navigation.navigate('AppointmentDetail', { id: next.id })} />
            </Card>
          ) : null}
          <Card title="Tıbbi bilgiler">
            <View style={styles.tagGroup}>
              <AppText variant="smallMedium" color="secondary">
                Alerjiler
              </AppText>
              <View style={styles.tags}>
                {patient.allergies?.length ? (
                  patient.allergies.map(a => <Badge key={a} label={a} tone="danger" />)
                ) : (
                  <AppText variant="small" color="tertiary">
                    Bilinen alerji yok
                  </AppText>
                )}
              </View>
            </View>
            <View style={styles.tagGroup}>
              <AppText variant="smallMedium" color="secondary">
                Kronik hastalıklar
              </AppText>
              <View style={styles.tags}>
                {patient.conditions?.length ? (
                  patient.conditions.map(c => <Badge key={c} label={c} tone="purple" />)
                ) : (
                  <AppText variant="small" color="tertiary">
                    Kayıt yok
                  </AppText>
                )}
              </View>
            </View>
            <InfoRow label="Kan grubu" value={patient.bloodType} last />
          </Card>
          <Card title="Kişisel bilgiler">
            <InfoRow label="Doğum tarihi" value={formatDate(patient.birthDate, 'd MMMM yyyy')} />
            <InfoRow label="Telefon" value={patient.phone} onPress={patient.phone ? () => Linking.openURL(phoneHref(patient.phone)) : undefined} />
            <InfoRow label="E-posta" value={patient.email} />
            <InfoRow label="Sigorta" value={patient.insurance} />
            <InfoRow label="Klinik" value={clinicName(patient.clinicId)} />
            <InfoRow label="Kayıt tarihi" value={formatDate(patient.createdAt, 'd MMMM yyyy')} last />
          </Card>
          <Card title="Notlar">
            <FormField placeholder="Not ekleyin..." value={note} onChangeText={setNote} multiline maxLength={500} style={styles.noteField} />
            <Button title="Notu Kaydet" icon="plus" size="sm" variant="secondary" onPress={addNote} disabled={!note.trim()} />
            {patient.notes ? (
              <View style={styles.note}>
                <AppText variant="body">{patient.notes}</AppText>
              </View>
            ) : null}
            {notes.map(n => (
              <View key={n.id} style={styles.note}>
                <AppText variant="caption" color="tertiary">
                  {formatDate(n.date.slice(0, 10), 'd MMMM yyyy')}
                </AppText>
                <AppText variant="body">{n.text}</AppText>
              </View>
            ))}
          </Card>
          <Button title="Hasta Kaydını Sil" icon="trash-2" variant="dangerSoft" onPress={confirmDelete} />
        </>
      ) : null}

      {tab === 'visits' ? (
        visits.length ? (
          visits.map(v => (
            <AppointmentCard key={v.id} appointment={v} showDate showPatient={false} onPress={() => navigation.navigate('AppointmentDetail', { id: v.id })} />
          ))
        ) : (
          <EmptyState icon="calendar" title="Henüz randevu yok" actionLabel="Randevu oluştur" onAction={() => navigation.navigate('AppointmentForm', { patientId: patient.id })} />
        )
      ) : null}

      {tab === 'payments' ? (
        <>
          <Card>
            <View style={styles.balanceRow}>
              <View>
                <AppText variant="small" color="secondary">
                  Açık bakiye
                </AppText>
                <AppText variant="display" color={balance.due > 0 ? 'warning' : 'success'}>
                  {format(balance.due)}
                </AppText>
              </View>
              {balance.due > 0 ? <Button title="Tümünü Tahsil Et" size="sm" icon="check" onPress={collectAll} /> : null}
            </View>
            <AppText variant="small" color="tertiary">
              Toplam {format(balance.total)} · Ödenen {format(balance.paid)}
            </AppText>
          </Card>
          <Button
            title="Tahsilat Ekle"
            icon="plus"
            variant="outline"
            style={styles.addPayment}
            onPress={() => navigation.navigate('TransactionForm', { type: 'income', patientId: patient.id })}
          />
          <Card padded={false} style={styles.list}>
            {payments.length ? (
              payments.map((t, i) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  divider={i < payments.length - 1}
                  onPress={t.status === 'pending' ? () => {
                    updateTransaction({ id: t.id, status: 'paid' });
                    toast.show(`${format(t.amount)} tahsil edildi`);
                  } : undefined}
                />
              ))
            ) : (
              <EmptyState icon="credit-card" title="Ödeme kaydı yok" compact />
            )}
          </Card>
          {payments.some(t => t.status === 'pending') ? (
            <AppText variant="caption" color="tertiary" align="center">
              Bekleyen bir ödemeyi tahsil etmek için üzerine dokunun.
            </AppText>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <AppText variant="h3" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="caption" color="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = t => ({
  hero: { alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 18 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  contact: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  contactItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  dimmed: { opacity: 0.45 },
  stats: {
    flexDirection: 'row',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingVertical: 14,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 6 },
  tabs: { marginBottom: 16 },
  tagGroup: { gap: 8, marginBottom: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  noteField: { marginBottom: 10 },
  note: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.colors.border, gap: 2 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  addPayment: { marginBottom: 14 },
  list: { paddingHorizontal: 14 },
});
