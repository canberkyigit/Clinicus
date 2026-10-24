import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Sheet from '../shared/components/Sheet';
import AppText from '../shared/components/AppText';
import { useStyles, useTheme } from '../shared/theme/ThemeProvider';

const ACTIONS = [
  { key: 'appt', icon: 'calendar', tone: 'success', label: 'Yeni Randevu', route: 'AppointmentForm' },
  { key: 'patient', icon: 'user-plus', tone: 'info', label: 'Yeni Hasta', route: 'PatientForm' },
  { key: 'income', icon: 'arrow-down-left', tone: 'success', label: 'Tahsilat', route: 'TransactionForm', params: { type: 'income' } },
  { key: 'expense', icon: 'arrow-up-right', tone: 'danger', label: 'Gider', route: 'TransactionForm', params: { type: 'expense' } },
  { key: 'leave', icon: 'sun', tone: 'warning', label: 'İzin Talebi', route: 'LeaveRequestForm' },
  { key: 'stock', icon: 'package', tone: 'purple', label: 'Stok Kalemi', route: 'InventoryForm' },
];

export default function QuickActionsSheet({ visible, onClose, onSelect }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Sheet visible={visible} title="Hızlı İşlemler" subtitle="Ne yapmak istersiniz?" onClose={onClose}>
      <View style={styles.grid}>
        {ACTIONS.map(a => (
          <Pressable
            key={a.key}
            onPress={() => onSelect(a.route, a.params)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: colors[`${a.tone}Muted`] }]}>
              <Feather name={a.icon} size={22} color={colors[a.tone]} />
            </View>
            <AppText variant="smallMedium" align="center">
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const makeStyles = t => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 8 },
  item: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  pressed: { backgroundColor: t.colors.surfacePressed },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
