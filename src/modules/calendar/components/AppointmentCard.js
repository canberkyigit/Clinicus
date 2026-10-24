import React from 'react';
import { Pressable, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import Badge from '../../../shared/components/Badge';
import { clinicCity } from '../../../shared/data/clinics';
import { APPOINTMENT_STATUS, statusMeta } from '../../../shared/data/constants';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { addMinutesToTime, relativeDay } from '../../../shared/utils/date';

// Agenda row: time column, status-coloured rail, patient + doctor details.
export default function AppointmentCard({ appointment: a, onPress, showDate = false, showPatient = true }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const status = statusMeta(APPOINTMENT_STATUS, a.status);
  const dimmed = a.status === 'cancelled' || a.status === 'noshow';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.time}, ${a.patientName}, ${a.doctorName}, ${status.label}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.timeCol}>
        {showDate ? (
          <AppText variant="caption" color="secondary" numberOfLines={1}>
            {relativeDay(a.date, new Date(), 'd MMM')}
          </AppText>
        ) : null}
        <AppText variant="bodyMedium">{a.time}</AppText>
        <AppText variant="caption" color="tertiary">
          {addMinutesToTime(a.time, a.duration || 30)}
        </AppText>
      </View>
      <View style={[styles.rail, { backgroundColor: colors[status.tone] }]} />
      <View style={[styles.body, dimmed && styles.dimmed]}>
        <View style={styles.titleRow}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.flex}>
            {showPatient ? a.patientName : a.doctorName}
          </AppText>
          <Badge label={status.label} tone={status.tone} />
        </View>
        <AppText variant="small" color="secondary" numberOfLines={1}>
          {a.type} · {showPatient ? a.doctorName : a.patientName}
        </AppText>
        <AppText variant="caption" color="tertiary" numberOfLines={1}>
          {clinicCity(a.clinicId)}
        </AppText>
      </View>
    </Pressable>
  );
}

const makeStyles = t => ({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  pressed: { backgroundColor: t.colors.surfacePressed },
  timeCol: { width: 50, justifyContent: 'center' },
  rail: { width: 3, borderRadius: 2 },
  body: { flex: 1, gap: 2 },
  dimmed: { opacity: 0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
