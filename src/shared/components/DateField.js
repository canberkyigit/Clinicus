import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import { formatDate, parseISODate, toISODate } from '../utils/date';
import AppText from './AppText';
import { FieldLabel } from './FormField';
import Sheet from './Sheet';
import Button from './Button';

// value / onChange use local "yyyy-MM-dd" strings. Android opens the native
// dialog; iOS shows an inline calendar in a sheet.
export default function DateField({ label, value, onChange, minimumDate, maximumDate, error, required, style }) {
  const { colors, isDark } = useTheme();
  const styles = useStyles(makeStyles);
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const current = parseISODate(value) || new Date();
  const minDate = parseISODate(minimumDate) || undefined;
  const maxDate = parseISODate(maximumDate) || undefined;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: minDate,
        maximumDate: maxDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatDate(value) : 'Seçilmedi' }}
        style={({ pressed }) => [styles.field, error && styles.error, pressed && styles.pressed]}
      >
        <Feather name="calendar" size={17} color={colors.textTertiary} />
        <AppText variant="body" color={value ? 'primary' : 'tertiary'}>
          {value ? formatDate(value, 'd MMM yyyy') : 'Tarih seç'}
        </AppText>
      </Pressable>
      {error ? (
        <AppText variant="small" color="danger" style={styles.message}>
          {error}
        </AppText>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Sheet
          visible={iosOpen}
          title={label || 'Tarih seç'}
          onClose={() => setIosOpen(false)}
          footer={
            <Button
              title="Seç"
              style={styles.flex}
              onPress={() => {
                onChange(toISODate(draft || current));
                setIosOpen(false);
              }}
            />
          }
        >
          <DateTimePicker
            value={draft || current}
            mode="date"
            display="inline"
            locale="tr-TR"
            themeVariant={isDark ? 'dark' : 'light'}
            accentColor={colors.primary}
            minimumDate={minDate}
            maximumDate={maxDate}
            onChange={(event, date) => date && setDraft(date)}
          />
        </Sheet>
      ) : null}
    </View>
  );
}

const makeStyles = t => ({
  wrapper: { flex: 1, marginBottom: 14 },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: 14,
  },
  error: { borderColor: t.colors.danger },
  pressed: { opacity: 0.7 },
  message: { marginTop: 5 },
});
