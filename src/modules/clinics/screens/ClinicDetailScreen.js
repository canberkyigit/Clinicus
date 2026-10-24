import React, { useMemo } from 'react';
import { View } from 'react-native';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import KpiCard from '../../../shared/components/KpiCard';
import ListItem from '../../../shared/components/ListItem';
import Screen from '../../../shared/components/Screen';
import { useAppData, useMoney } from '../../../shared/context/AppDataContext';
import { PERSONNEL_STATUS_TONES } from '../../../shared/data/constants';
import { useStyles } from '../../../shared/theme/ThemeProvider';
import AppointmentCard from '../../calendar/components/AppointmentCard';
import { clinicStats } from '../data/clinicStats';

export default function ClinicDetailScreen({ route, navigation }) {
  const { personnel, appointments, transactions, inventory } = useAppData();
  const { format } = useMoney();
  const styles = useStyles(makeStyles);
  const clinic = useMemo(
    () => clinicStats({ personnel, appointments, transactions, inventory }).find(c => c.id === route.params?.id),
    [personnel, appointments, transactions, inventory, route.params?.id]
  );

  if (!clinic) {
    return (
      <Screen title="Klinik" onBack={navigation.goBack}>
        <EmptyState icon="map-pin" title="Klinik bulunamadı" />
      </Screen>
    );
  }

  return (
    <Screen title={clinic.city} subtitle={clinic.name} onBack={navigation.goBack}>
      <View style={styles.row}>
        <KpiCard icon="calendar" tone="info" label="Bugün" value={String(clinic.today.length)} caption={`Bu ay ${clinic.monthAppointments}`} />
        <KpiCard icon="users" tone="purple" label="Aktif personel" value={`${clinic.activeStaff}/${clinic.staff.length}`} />
      </View>
      <View style={styles.row}>
        <KpiCard icon="trending-up" label="Bu ay gelir" value={format(clinic.income, { compact: true })} />
        <KpiCard icon="trending-down" tone="danger" label="Bu ay gider" value={format(clinic.expense, { compact: true })} />
      </View>

      <Card title="Bugünün programı" actionLabel="Takvim" onAction={() => navigation.navigate('Main', { screen: 'Calendar' })}>
        {clinic.today.length ? (
          clinic.today.map(a => (
            <AppointmentCard key={a.id} appointment={a} onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })} />
          ))
        ) : (
          <EmptyState icon="calendar" title="Bugün randevu yok" compact />
        )}
      </Card>

      {clinic.lowStock.length ? (
        <Card title="Kritik stok" actionLabel="Stok" onAction={() => navigation.navigate('Inventory')}>
          {clinic.lowStock.map((i, idx) => (
            <ListItem
              key={i.id}
              icon="package"
              iconTone={i.quantity === 0 ? 'danger' : 'warning'}
              title={i.name}
              subtitle={`${i.quantity} ${i.unit} kaldı · min ${i.minQuantity}`}
              divider={idx < clinic.lowStock.length - 1}
            />
          ))}
        </Card>
      ) : null}

      <Card title="Ekip">
        {clinic.staff.map((p, i) => (
          <ListItem
            key={p.id}
            leading={<Avatar uri={p.avatar} name={p.name} size={40} />}
            title={p.name}
            subtitle={[p.role, p.specialty].filter(Boolean).join(' · ')}
            trailing={<Badge label={p.status} tone={PERSONNEL_STATUS_TONES[p.status]} />}
            chevron
            divider={i < clinic.staff.length - 1}
            onPress={() => navigation.navigate('PersonnelProfile', { id: p.id })}
          />
        ))}
        {clinic.staff.length === 0 ? <EmptyState icon="users" title="Kayıtlı personel yok" compact /> : null}
      </Card>
    </Screen>
  );
}

const makeStyles = () => ({
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
});
