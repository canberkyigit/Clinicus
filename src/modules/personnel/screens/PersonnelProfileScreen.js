import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { startOfMonth } from 'date-fns';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import InfoRow from '../../../shared/components/InfoRow';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import { useToast } from '../../../shared/components/Toast';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { clinicName } from '../../../shared/data/clinics';
import { PERSONNEL_STATUS, PERSONNEL_STATUS_TONES, ROLE_TONES } from '../../../shared/data/constants';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { toISODate } from '../../../shared/utils/date';
import { phoneHref } from '../../../shared/utils/format';
import AppointmentCard from '../../calendar/components/AppointmentCard';
import { upcoming } from '../../calendar/data/appointmentSelectors';

export default function PersonnelProfileScreen({ route, navigation }) {
  const { personnel, appointments, transactions, updatePersonnel, removePersonnel } = useAppData();
  const { format } = useMoney();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles(makeStyles);
  const person = personnel.find(p => p.id === route.params?.id);
  const isDoctor = person?.role === 'Doktor';

  const stats = useMemo(() => {
    if (!person || !isDoctor) return null;
    const monthStart = toISODate(startOfMonth(new Date()));
    const own = appointments.filter(a => a.doctorId === person.id);
    return {
      next: upcoming(own, new Date(), 3),
      month: own.filter(a => a.date >= monthStart && a.status !== 'cancelled').length,
      completed: own.filter(a => a.status === 'completed').length,
      revenue: transactions
        .filter(t => t.doctorId === person.id && t.date >= monthStart && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    };
  }, [person, isDoctor, appointments, transactions]);

  if (!person) {
    return (
      <Screen title="Personel" onBack={navigation.goBack}>
        <EmptyState icon="user-x" title="Personel bulunamadı" message="Bu kayıt silinmiş olabilir." />
      </Screen>
    );
  }

  const connectedTo = personnel.find(p => p.id === person.connectedToId);
  const team = personnel.filter(p => p.connectedToId === person.id);

  const confirmDelete = () =>
    Alert.alert('Personeli sil', `${person.name} kaydı kalıcı olarak silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          removePersonnel(person.id);
          toast.show('Personel silindi', { tone: 'info' });
        },
      },
    ]);

  const contact = [
    { icon: 'phone', label: 'Ara', url: person.phone && phoneHref(person.phone) },
    { icon: 'message-circle', label: 'SMS', url: person.phone && phoneHref(person.phone).replace('tel:', 'sms:') },
    { icon: 'mail', label: 'E-posta', url: person.email && `mailto:${person.email}` },
  ];

  return (
    <Screen
      title="Personel Profili"
      onBack={navigation.goBack}
      right={<IconButton icon="edit-2" onPress={() => navigation.navigate('PersonnelForm', { id: person.id })} accessibilityLabel="Düzenle" />}
    >
      <View style={styles.hero}>
        <Avatar uri={person.avatar} name={person.name} size={88} ring />
        <AppText variant="h1" align="center">
          {person.name}
        </AppText>
        <AppText variant="body" color="secondary" align="center">
          {[person.title, person.specialty].filter(Boolean).join(' · ') || person.role}
        </AppText>
        <View style={styles.badges}>
          <Badge label={person.role} tone={ROLE_TONES[person.role]} />
          <Badge label={person.status} tone={PERSONNEL_STATUS_TONES[person.status]} dot />
        </View>
      </View>

      <View style={styles.contact}>
        {contact.map(c => (
          <Pressable
            key={c.label}
            disabled={!c.url}
            onPress={() => Linking.openURL(c.url).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel={c.label}
            style={({ pressed }) => [styles.contactItem, (pressed || !c.url) && styles.dimmed]}
          >
            <Feather name={c.icon} size={19} color={colors.primary} />
            <AppText variant="caption" color="secondary">
              {c.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {stats ? (
        <>
          <View style={styles.stats}>
            <Stat label="Bu ay randevu" value={stats.month} />
            <Stat label="Toplam muayene" value={stats.completed} />
            <Stat label="Bu ay gelir" value={format(stats.revenue, { compact: true })} />
          </View>
          <Card
            title="Yaklaşan randevular"
            actionLabel="Yeni"
            onAction={() => navigation.navigate('AppointmentForm', { doctorId: person.id })}
          >
            {stats.next.length ? (
              stats.next.map(a => (
                <AppointmentCard key={a.id} appointment={a} showDate onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })} />
              ))
            ) : (
              <EmptyState icon="calendar" title="Planlı randevu yok" compact />
            )}
          </Card>
        </>
      ) : null}

      <Card title="Durum">
        <ChipGroup
          options={PERSONNEL_STATUS.map(s => ({ value: s, label: s, tone: PERSONNEL_STATUS_TONES[s] }))}
          value={person.status}
          onChange={status => {
            updatePersonnel({ id: person.id, status });
            toast.show(`Durum: ${status}`);
          }}
        />
      </Card>

      <Card title="Bilgiler">
        <InfoRow label="Klinik" value={clinicName(person.clinicId)} />
        {connectedTo ? (
          <InfoRow label="Bağlı hekim" value={connectedTo.name} onPress={() => navigation.push('PersonnelProfile', { id: connectedTo.id })} />
        ) : null}
        <InfoRow label="Mezuniyet" value={person.graduation} />
        <InfoRow label="Deneyim" value={person.yearsOfExperience != null ? `${person.yearsOfExperience} yıl` : null} />
        <InfoRow label="Yaş" value={person.age} />
        {isDoctor ? <InfoRow label="Toplam vaka" value={person.caseCount?.toLocaleString('tr-TR')} /> : null}
        <InfoRow label="Diller" value={person.languages?.join(', ')} />
        <InfoRow label="Telefon" value={person.phone} />
        <InfoRow label="E-posta" value={person.email} last />
        {person.bio ? (
          <AppText variant="body" color="secondary" style={styles.bio}>
            {person.bio}
          </AppText>
        ) : null}
      </Card>

      {team.length ? (
        <Card title="Ekibi">
          {team.map((m, i) => (
            <ListItem
              key={m.id}
              leading={<Avatar uri={m.avatar} name={m.name} size={38} />}
              title={m.name}
              subtitle={m.role}
              chevron
              divider={i < team.length - 1}
              onPress={() => navigation.push('PersonnelProfile', { id: m.id })}
            />
          ))}
        </Card>
      ) : null}

      <Button title="Personeli Sil" icon="trash-2" variant="dangerSoft" onPress={confirmDelete} />
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
      <AppText variant="caption" color="tertiary" align="center">
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = t => ({
  hero: { alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 18 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
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
    marginBottom: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 6 },
  bio: { marginTop: 12 },
});
