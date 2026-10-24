import React from 'react';
import { Alert, Linking, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import InfoRow from '../../../shared/components/InfoRow';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import { useToast } from '../../../shared/components/Toast';
import { useAppData, useLookup, useMoney } from '../../../shared/context/AppDataContext';
import { clinicName } from '../../../shared/data/clinics';
import { APPOINTMENT_STATUS, statusMeta } from '../../../shared/data/constants';
import { useHaptics } from '../../../shared/hooks/useHaptics';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import { addMinutesToTime, formatDate, relativeDay } from '../../../shared/utils/date';
import { phoneHref } from '../../../shared/utils/format';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { appointments, transactions, setAppointmentStatus, updateTransaction, removeAppointment } = useAppData();
  const patients = useLookup('patients');
  const personnel = useLookup('personnel');
  const { format } = useMoney();
  const toast = useToast();
  const haptics = useHaptics();
  const styles = useStyles(makeStyles);
  const a = appointments.find(x => x.id === route.params?.id);

  if (!a) {
    return (
      <Screen title="Randevu" onBack={navigation.goBack}>
        <EmptyState icon="calendar" title="Randevu bulunamadı" message="Bu kayıt silinmiş olabilir." />
      </Screen>
    );
  }

  const status = statusMeta(APPOINTMENT_STATUS, a.status);
  const patient = patients[a.patientId];
  const doctor = personnel[a.doctorId];
  const payment = transactions.find(t => t.appointmentId === a.id);

  const changeStatus = (next, message) => {
    const previous = a.status;
    setAppointmentStatus(a.id, next);
    haptics.success();
    toast.show(message, { action: { label: 'Geri al', onPress: () => setAppointmentStatus(a.id, previous) } });
  };

  const confirmCancel = () =>
    Alert.alert('Randevuyu iptal et', `${a.patientName} için ${formatDate(a.date)} ${a.time} randevusu iptal edilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: () => changeStatus('cancelled', 'Randevu iptal edildi') },
    ]);

  const confirmDelete = () =>
    Alert.alert('Randevuyu sil', 'Bu randevu kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          removeAppointment(a.id);
          toast.show('Randevu silindi', { tone: 'info' });
        },
      },
    ]);

  const collect = () => {
    updateTransaction({ id: payment.id, status: 'paid' });
    haptics.success();
    toast.show(`${format(payment.amount)} tahsil edildi`);
  };

  return (
    <Screen
      title="Randevu Detayı"
      onBack={navigation.goBack}
      right={
        <IconButton
          icon="edit-2"
          onPress={() => navigation.navigate('AppointmentForm', { id: a.id })}
          accessibilityLabel="Düzenle"
        />
      }
    >
      <Card>
        <View style={styles.headerRow}>
          <Badge label={status.label} tone={status.tone} dot />
          <AppText variant="smallMedium" color="secondary">
            {a.type}
          </AppText>
        </View>
        <AppText variant="display" style={styles.time}>
          {a.time} – {addMinutesToTime(a.time, a.duration || 30)}
        </AppText>
        <AppText variant="body" color="secondary">
          {relativeDay(a.date, new Date(), 'd MMMM yyyy, EEEE')} · {clinicName(a.clinicId)}
        </AppText>
      </Card>

      {a.status === 'scheduled' ? (
        <View style={styles.actions}>
          <Button title="Tamamlandı" icon="check" style={styles.flex} onPress={() => changeStatus('completed', 'Randevu tamamlandı, ücret alacaklara eklendi')} />
          <Button title="Gelmedi" icon="user-x" variant="secondary" style={styles.flex} onPress={() => changeStatus('noshow', 'Hasta gelmedi olarak işaretlendi')} />
        </View>
      ) : (
        <Button
          title="Planlandı olarak geri al"
          icon="rotate-ccw"
          variant="secondary"
          style={styles.block}
          onPress={() => changeStatus('scheduled', 'Randevu tekrar planlandı')}
        />
      )}

      <Card title="Hasta" actionLabel={patient ? 'Dosyayı aç' : undefined} onAction={() => navigation.navigate('PatientDetail', { id: a.patientId })}>
        <ListItem
          leading={<Avatar name={a.patientName} size={44} />}
          title={a.patientName}
          subtitle={patient ? `${patient.phone} · ${patient.insurance}` : 'Hasta kaydı silinmiş'}
          trailing={
            patient?.phone ? (
              <IconButton icon="phone" variant="tinted" size={17} onPress={() => Linking.openURL(phoneHref(patient.phone)).catch(() => {})} accessibilityLabel="Hastayı ara" />
            ) : null
          }
          divider={false}
          onPress={patient ? () => navigation.navigate('PatientDetail', { id: a.patientId }) : undefined}
        />
        {patient?.allergies?.length ? (
          <View style={styles.allergy}>
            <Badge label={`Alerji: ${patient.allergies.join(', ')}`} tone="danger" />
          </View>
        ) : null}
      </Card>

      <Card title="Hekim">
        <ListItem
          leading={<Avatar uri={doctor?.avatar} name={a.doctorName} size={44} />}
          title={a.doctorName}
          subtitle={doctor?.specialty}
          chevron={!!doctor}
          divider={false}
          onPress={doctor ? () => navigation.navigate('PersonnelProfile', { id: doctor.id }) : undefined}
        />
      </Card>

      <Card title="Ödeme">
        <InfoRow label="Ücret" value={format(a.fee)} />
        {payment ? (
          <>
            <InfoRow label="Durum" value={payment.status === 'paid' ? 'Ödendi' : 'Bekliyor'} valueColor={payment.status === 'paid' ? 'success' : 'warning'} />
            <InfoRow label="Yöntem" value={payment.method} last={payment.status === 'paid'} />
            {payment.status === 'pending' ? (
              <Button title="Tahsil Et" icon="credit-card" onPress={collect} style={styles.collect} />
            ) : null}
          </>
        ) : (
          <InfoRow label="Durum" value={a.status === 'completed' ? 'Ücretsiz' : 'Randevu tamamlanınca oluşur'} last />
        )}
      </Card>

      {a.notes ? (
        <Card title="Notlar">
          <AppText variant="body" color="secondary">
            {a.notes}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.actions}>
        {a.status === 'scheduled' ? (
          <Button title="İptal Et" icon="x" variant="dangerSoft" style={styles.flex} onPress={confirmCancel} />
        ) : null}
        <Button title="Sil" icon="trash-2" variant="dangerSoft" style={styles.flex} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const makeStyles = () => ({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { marginTop: 12, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  block: { marginBottom: 14 },
  allergy: { marginTop: 10 },
  collect: { marginTop: 12 },
});
