import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import Screen from '../../../shared/components/Screen';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { useStyles, useTheme } from '../../../shared/theme/ThemeProvider';
import { clinicStats } from '../data/clinicStats';

export default function ClinicsScreen({ navigation }) {
  const { personnel, appointments, transactions, inventory } = useAppData();
  const { format } = useMoney();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const clinics = useMemo(
    () => clinicStats({ personnel, appointments, transactions, inventory }),
    [personnel, appointments, transactions, inventory]
  );

  return (
    <Screen title="Klinikler" subtitle={`${clinics.length} şube`} onBack={navigation.goBack}>
      {clinics.map(c => (
        <Card key={c.id} onPress={() => navigation.navigate('ClinicDetail', { id: c.id })}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Feather name="map-pin" size={18} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="h3">{c.name}</AppText>
              <AppText variant="small" color="secondary">
                {c.doctors.length} hekim · {c.staff.length} personel
              </AppText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
          <View style={styles.stats}>
            <Stat label="Bugün" value={c.today.length} />
            <Stat label="Bu ay" value={c.monthAppointments} />
            <Stat label="Gelir" value={format(c.income, { compact: true })} />
          </View>
          {c.lowStock.length ? (
            <Badge label={`${c.lowStock.length} kritik stok kalemi`} tone="warning" dot style={styles.badge} />
          ) : null}
        </Card>
      ))}
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
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md, paddingVertical: 10, alignItems: 'center' },
  badge: { marginTop: 12 },
});
