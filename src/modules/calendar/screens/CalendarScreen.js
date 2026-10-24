import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { addDays, addWeeks, format, isSameDay, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import AppText from '../../../shared/components/AppText';
import Button from '../../../shared/components/Button';
import ChipGroup from '../../../shared/components/Chip';
import EmptyState from '../../../shared/components/EmptyState';
import IconButton from '../../../shared/components/IconButton';
import Screen from '../../../shared/components/Screen';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Sheet from '../../../shared/components/Sheet';
import { FieldLabel } from '../../../shared/components/FormField';
import { useAppData } from '../../../shared/context/AppDataContext';
import { CLINICS } from '../../../shared/data/clinics';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { formatDate, parseISODate, toISODate } from '../../../shared/utils/date';
import AppointmentCard from '../components/AppointmentCard';
import { filterAppointments, groupByDate, statusCounts } from '../data/appointmentSelectors';

LocaleConfig.locales.tr = {
  monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

const ALL = 'all';
const VIEWS = [
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
];

export default function CalendarScreen({ navigation }) {
  const { appointments, personnel } = useAppData();
  const { colors, isDark, fonts } = useTheme();
  const styles = useStyles(makeStyles);
  const todayIso = toISODate(new Date());
  const [selected, setSelected] = useState(todayIso);
  const [view, setView] = useState('week');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [clinicId, setClinicId] = useState(ALL);
  const [doctorId, setDoctorId] = useState(ALL);

  const doctors = useMemo(
    () => personnel.filter(p => p.role === 'Doktor' && (clinicId === ALL || p.clinicId === clinicId)),
    [personnel, clinicId]
  );
  const filtered = useMemo(
    () =>
      filterAppointments(appointments, {
        clinicId: clinicId === ALL ? undefined : clinicId,
        doctorId: doctorId === ALL ? undefined : doctorId,
      }),
    [appointments, clinicId, doctorId]
  );
  const byDate = useMemo(() => groupByDate(filtered), [filtered]);
  const day = byDate[selected] || [];
  const dayStats = statusCounts(day);
  const activeFilters = (clinicId !== ALL) + (doctorId !== ALL);

  const weekStart = startOfWeek(parseISODate(selected), { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const markedDates = useMemo(() => {
    const marks = {};
    Object.entries(byDate).forEach(([date, list]) => {
      const scheduled = list.some(a => a.status === 'scheduled');
      marks[date] = { marked: true, dotColor: scheduled ? colors.info : colors.primary };
    });
    marks[selected] = { ...(marks[selected] || {}), selected: true, selectedColor: colors.primary, selectedTextColor: colors.onPrimary };
    return marks;
  }, [byDate, selected, colors]);

  const changeClinic = id => {
    setClinicId(id);
    if (id !== ALL && doctorId !== ALL && personnel.find(p => p.id === doctorId)?.clinicId !== id) setDoctorId(ALL);
  };

  return (
    <Screen
      title="Takvim"
      subtitle={format(parseISODate(selected), 'MMMM yyyy', { locale: tr })}
      large
      tabBar
      right={
        <>
          <IconButton
            icon="sliders"
            variant="tinted"
            badge={activeFilters || undefined}
            onPress={() => setFiltersOpen(true)}
            accessibilityLabel="Filtreler"
          />
          <IconButton
            icon="plus"
            variant="primary"
            onPress={() => navigation.navigate('AppointmentForm', { date: selected })}
            accessibilityLabel="Randevu ekle"
          />
        </>
      }
    >
      <View style={styles.toolbar}>
        <SegmentedControl options={VIEWS} value={view} onChange={setView} style={styles.flex} />
        <Button title="Bugün" size="sm" variant="secondary" onPress={() => setSelected(todayIso)} />
      </View>

      {view === 'week' ? (
        <View style={styles.weekBox}>
          <IconButton icon="chevron-left" onPress={() => setSelected(toISODate(addWeeks(parseISODate(selected), -1)))} accessibilityLabel="Önceki hafta" size={18} />
          {week.map(d => {
            const iso = toISODate(d);
            const isSelected = iso === selected;
            const isToday = isSameDay(d, new Date());
            const count = (byDate[iso] || []).filter(a => a.status !== 'cancelled').length;
            return (
              <Pressable
                key={iso}
                onPress={() => setSelected(iso)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${formatDate(iso, 'd MMMM EEEE')}, ${count} randevu`}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              >
                <AppText variant="caption" color={isSelected ? 'onPrimary' : 'tertiary'}>
                  {format(d, 'EEEEEE', { locale: tr })}
                </AppText>
                <AppText variant="h3" color={isSelected ? 'onPrimary' : isToday ? 'brand' : 'primary'}>
                  {format(d, 'd')}
                </AppText>
                <View style={styles.dots}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: isSelected ? colors.onPrimary : colors.primary }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
          <IconButton icon="chevron-right" onPress={() => setSelected(toISODate(addWeeks(parseISODate(selected), 1)))} accessibilityLabel="Sonraki hafta" size={18} />
        </View>
      ) : (
        <View style={styles.monthBox}>
          <Calendar
            key={isDark ? 'dark' : 'light'}
            current={selected}
            onDayPress={d => setSelected(d.dateString)}
            markedDates={markedDates}
            firstDay={1}
            enableSwipeMonths
            theme={{
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textTertiary,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textTertiary,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontFamily: fonts.medium,
              textMonthFontFamily: fonts.semibold,
              textDayHeaderFontFamily: fonts.medium,
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>
      )}

      <View style={styles.dayHeader}>
        <View style={styles.flex}>
          <AppText variant="h2">{formatDate(selected, 'd MMMM, EEEE')}</AppText>
          <AppText variant="small" color="secondary">
            {dayStats.total} randevu · {dayStats.scheduled} planlı · {dayStats.completed} tamamlandı
          </AppText>
        </View>
      </View>

      {day.length ? (
        day.map(a => (
          <AppointmentCard key={a.id} appointment={a} onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })} />
        ))
      ) : (
        <EmptyState
          icon="calendar"
          title="Bu gün için randevu yok"
          message={parseISODate(selected).getDay() === 0 ? 'Pazar günleri klinikler kapalı.' : undefined}
          actionLabel="Randevu ekle"
          onAction={() => navigation.navigate('AppointmentForm', { date: selected })}
        />
      )}

      <Sheet
        visible={filtersOpen}
        title="Filtreler"
        onClose={() => setFiltersOpen(false)}
        footer={
          <>
            <Button
              title="Temizle"
              variant="secondary"
              style={styles.flex}
              onPress={() => {
                setClinicId(ALL);
                setDoctorId(ALL);
              }}
            />
            <Button title="Uygula" style={styles.flex} onPress={() => setFiltersOpen(false)} />
          </>
        }
      >
        <FieldLabel label="Klinik" />
        <ChipGroup
          options={[{ value: ALL, label: 'Tümü' }, ...CLINICS.map(c => ({ value: c.id, label: c.city }))]}
          value={clinicId}
          onChange={changeClinic}
          style={styles.filterGroup}
        />
        <FieldLabel label="Doktor" />
        <ChipGroup
          options={[{ value: ALL, label: 'Tümü' }, ...doctors.map(d => ({ value: d.id, label: d.name }))]}
          value={doctorId}
          onChange={setDoctorId}
          style={styles.filterGroup}
        />
        {activeFilters ? (
          <View style={styles.filterNote}>
            <Feather name="info" size={14} color={colors.textTertiary} />
            <AppText variant="small" color="tertiary">
              {activeFilters} filtre aktif
            </AppText>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  weekBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingVertical: 8,
    marginBottom: 18,
  },
  dayCell: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: t.radius.md },
  dayCellSelected: { backgroundColor: t.colors.primary },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  monthBox: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 6,
    marginBottom: 18,
    overflow: 'hidden',
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  filterGroup: { marginBottom: 18 },
  filterNote: { flexDirection: 'row', gap: 6, alignItems: 'center' },
});
