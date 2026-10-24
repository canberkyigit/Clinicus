import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import AppText from '../../../shared/components/AppText';
import Avatar from '../../../shared/components/Avatar';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import KpiCard from '../../../shared/components/KpiCard';
import ProgressBar from '../../../shared/components/ProgressBar';
import SectionHeader from '../../../shared/components/SectionHeader';
import { useTabBarPadding } from '../../../shared/components/Screen';
import { displayNameOf, useAuth } from '../../../shared/context/AuthContext';
import { useAppData, useLookup, useMoney } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { greetingForHour, relativeDay, toISODate } from '../../../shared/utils/date';
import { formatPercent, percentChange } from '../../../shared/utils/format';
import AppointmentCard from '../../calendar/components/AppointmentCard';
import {
  appointmentsBetween,
  appointmentsInMonth,
  appointmentsOnDay,
  rankBy,
  upcoming,
} from '../../calendar/data/appointmentSelectors';
import { dailySeries, inRange, periodRange, summarize } from '../../finance/data/financeSelectors';
import { useNotifications } from '../../notifications/useNotifications';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { appointments, transactions, patients } = useAppData();
  const personnelById = useLookup('personnel');
  const { format: money } = useMoney();
  const { notifications, unreadCount } = useNotifications();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBarPadding();

  const data = useMemo(() => {
    const now = new Date();
    const todayIso = toISODate(now);
    const range = periodRange('month', now);
    const monthAppts = appointmentsBetween(appointments, range.start, range.end).filter(a => a.status !== 'cancelled');
    const prevAppts = appointmentsBetween(appointments, range.prevStart, range.prevEnd).filter(a => a.status !== 'cancelled');
    const finance = summarize(inRange(transactions, range.start, range.end));
    const prevFinance = summarize(inRange(transactions, range.prevStart, range.prevEnd));
    const newPatients = patients.filter(p => p.createdAt >= range.start && p.createdAt <= range.end).length;
    const prevNewPatients = patients.filter(p => p.createdAt >= range.prevStart && p.createdAt <= range.prevEnd).length;
    const today = appointmentsOnDay(appointments, todayIso).filter(a => a.status !== 'cancelled');
    const fullMonth = appointmentsInMonth(appointments, now);

    return {
      today,
      todayDone: today.filter(a => a.status === 'completed').length,
      next: upcoming(appointments, now, 4),
      monthCount: monthAppts.length,
      monthDelta: percentChange(monthAppts.length, prevAppts.length),
      finance,
      incomeDelta: percentChange(finance.income, prevFinance.income),
      newPatients,
      patientDelta: percentChange(newPatients, prevNewPatients),
      incomeSpark: dailySeries(transactions, toISODate(subDays(now, 29)), todayIso).map(p => p.value),
      clinics: CLINICS.map(c => ({
        ...c,
        count: fullMonth.filter(a => a.clinicId === c.id && a.status !== 'cancelled').length,
      })).sort((a, b) => b.count - a.count),
      doctors: rankBy(monthAppts, a => a.doctorId).slice(0, 5),
    };
  }, [appointments, transactions, patients]);

  const name = displayNameOf(user);
  const now = new Date();
  const maxClinic = Math.max(1, ...data.clinics.map(c => c.count));
  const alerts = notifications.filter(n => !n.read && n.tone !== 'info').slice(0, 3);
  const nextAppt = data.next[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Profil ve ayarlar">
          <Avatar uri={user?.photoURL} name={name || user?.email} size={44} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="small" color="secondary">
            {greetingForHour(now.getHours())},
          </AppText>
          <AppText variant="h2" numberOfLines={1}>
            {name || 'Hoş geldiniz'}
          </AppText>
        </View>
        <IconButton icon="search" variant="tinted" onPress={() => navigation.navigate('Search')} accessibilityLabel="Ara" />
        <IconButton
          icon="bell"
          variant="tinted"
          badge={unreadCount}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel={`Bildirimler, ${unreadCount} okunmamış`}
        />
      </View>

      <View style={styles.content}>
        {/* Today hero */}
        <Pressable
          onPress={() => navigation.navigate('Calendar')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
        >
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <AppText variant="caption" color="onPrimary" style={styles.heroCaption}>
                {format(now, 'd MMMM yyyy, EEEE', { locale: tr }).toLocaleUpperCase('tr-TR')}
              </AppText>
              <AppText variant="display" color="onPrimary">
                {data.today.length} randevu
              </AppText>
              <AppText variant="small" color="onPrimary" style={styles.heroSub}>
                {data.todayDone} tamamlandı · {data.today.length - data.todayDone} kaldı
              </AppText>
            </View>
            <View style={styles.heroIcon}>
              <Feather name="calendar" size={22} color={colors.onPrimary} />
            </View>
          </View>
          <ProgressBar value={data.todayDone} max={Math.max(data.today.length, 1)} tone="onPrimary" style={styles.heroBar} />
          {nextAppt ? (
            <View style={styles.nextBox}>
              <Feather name="clock" size={15} color={colors.onPrimary} />
              <AppText variant="smallMedium" color="onPrimary" numberOfLines={1} style={styles.flex}>
                Sıradaki: {relativeDay(nextAppt.date, now, 'd MMM')} {nextAppt.time} · {nextAppt.patientName}
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.onPrimary} />
            </View>
          ) : null}
        </Pressable>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="trending-up"
            label="Bu ay gelir"
            value={money(data.finance.income, { compact: true })}
            delta={data.incomeDelta}
            spark={data.incomeSpark}
            onPress={() => navigation.navigate('Finance')}
          />
          <KpiCard
            icon="calendar"
            tone="info"
            label="Bu ay randevu"
            value={String(data.monthCount)}
            delta={data.monthDelta}
            caption="Geçen ayın aynı dönemine göre"
            onPress={() => navigation.navigate('Reports')}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            icon="user-plus"
            tone="purple"
            label="Yeni hasta"
            value={String(data.newPatients)}
            delta={data.patientDelta}
            caption="Bu ay ilk kez gelen"
            onPress={() => navigation.navigate('Patients')}
          />
          <KpiCard
            icon="percent"
            tone="warning"
            label="Tahsilat oranı"
            value={formatPercent(data.finance.collectionRate)}
            caption={`Alacak: ${money(data.finance.receivable, { compact: true })}`}
            onPress={() => navigation.navigate('Transactions', { status: 'pending' })}
          />
        </View>

        {/* Shortcuts */}
        <View style={styles.shortcuts}>
          {[
            { icon: 'calendar', label: 'Randevu', tone: 'success', onPress: () => navigation.navigate('AppointmentForm') },
            { icon: 'user-plus', label: 'Hasta', tone: 'info', onPress: () => navigation.navigate('PatientForm') },
            { icon: 'credit-card', label: 'Tahsilat', tone: 'warning', onPress: () => navigation.navigate('TransactionForm', { type: 'income' }) },
            { icon: 'bar-chart-2', label: 'Raporlar', tone: 'purple', onPress: () => navigation.navigate('Reports') },
          ].map(s => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors[`${s.tone}Muted`] }]}>
                <Feather name={s.icon} size={20} color={colors[s.tone]} />
              </View>
              <AppText variant="caption" color="secondary">
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Upcoming */}
        <SectionHeader title="Sıradaki Randevular" actionLabel="Takvim" onAction={() => navigation.navigate('Calendar')} />
        {data.next.length ? (
          data.next.map(a => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              showDate={a.date !== toISODate(now)}
              onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })}
            />
          ))
        ) : (
          <Card>
            <EmptyState
              icon="calendar"
              title="Planlanmış randevu yok"
              actionLabel="Randevu oluştur"
              onAction={() => navigation.navigate('AppointmentForm')}
              compact
            />
          </Card>
        )}

        {/* Alerts */}
        {alerts.length ? (
          <>
            <SectionHeader title="Dikkat Gerektirenler" actionLabel="Tümü" onAction={() => navigation.navigate('Notifications')} inset />
            <Card padded={false}>
              {alerts.map((n, i) => (
                <Pressable
                  key={n.id}
                  onPress={() => navigation.navigate(n.route.name, n.route.params)}
                  style={({ pressed }) => [styles.alert, i < alerts.length - 1 && styles.alertDivider, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <View style={[styles.alertIcon, { backgroundColor: colors[`${n.tone}Muted`] }]}>
                    <Feather name={n.icon} size={16} color={colors[n.tone]} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="smallMedium">{n.title}</AppText>
                    <AppText variant="small" color="secondary" numberOfLines={1}>
                      {n.message}
                    </AppText>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}

        {/* Clinics */}
        <SectionHeader title="Klinik Yoğunluğu" actionLabel="Klinikler" onAction={() => navigation.navigate('Clinics')} inset />
        <Card>
          {data.clinics.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => navigation.navigate('ClinicDetail', { id: c.id })}
              accessibilityRole="button"
              accessibilityLabel={`${c.city}, bu ay ${c.count} randevu`}
              style={[styles.clinicRow, i === data.clinics.length - 1 && styles.last]}
            >
              <View style={styles.clinicText}>
                <AppText variant="bodyMedium">{c.city}</AppText>
                <AppText variant="small" color="secondary">
                  {c.count} randevu
                </AppText>
              </View>
              <ProgressBar value={c.count} max={maxClinic} />
            </Pressable>
          ))}
        </Card>

        {/* Doctors */}
        <SectionHeader title="Ayın Hekimleri" actionLabel="Personel" onAction={() => navigation.navigate('Personnel')} inset />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctors}>
          {data.doctors.map((d, i) => {
            const doctor = personnelById[d.key];
            if (!doctor) return null;
            return (
              <Pressable
                key={d.key}
                onPress={() => navigation.navigate('PersonnelProfile', { id: d.key })}
                accessibilityRole="button"
                style={({ pressed }) => [styles.doctor, pressed && styles.pressed]}
              >
                <View>
                  <Avatar uri={doctor.avatar} name={doctor.name} size={56} ring={i === 0} />
                  <View style={styles.rank}>
                    <AppText variant="caption" color="onPrimary">
                      {i + 1}
                    </AppText>
                  </View>
                </View>
                <AppText variant="smallMedium" numberOfLines={1} align="center">
                  {doctor.name.replace(/^Dr\.\s*/, '')}
                </AppText>
                <AppText variant="caption" color="tertiary" numberOfLines={1}>
                  {doctor.specialty}
                </AppText>
                <AppText variant="smallMedium" color="brand">
                  {d.count} randevu
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const makeStyles = t => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: t.spacing.screen, marginBottom: 18 },
  content: { paddingHorizontal: t.spacing.screen },
  hero: { backgroundColor: t.colors.primary, borderRadius: t.radius.xl, padding: 18, marginBottom: 14 },
  heroPressed: { opacity: 0.92 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroCaption: { opacity: 0.75, marginBottom: 4 },
  heroSub: { opacity: 0.85, marginTop: 2 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBar: { marginTop: 14, backgroundColor: 'rgba(0,0,0,0.12)' },
  nextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: t.radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 22 },
  shortcut: { alignItems: 'center', gap: 6, width: '23%' },
  shortcutIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  alertDivider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  alertIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clinicRow: { paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: t.colors.border, gap: 8 },
  last: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  clinicText: { flexDirection: 'row', justifyContent: 'space-between' },
  doctors: { gap: 12, paddingBottom: 4 },
  doctor: {
    width: 128,
    alignItems: 'center',
    gap: 4,
    padding: 14,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  rank: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
    borderWidth: 2,
    borderColor: t.colors.surface,
  },
});
