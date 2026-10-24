import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import { matchesSearch } from '../utils/format';
import { useHaptics } from '../hooks/useHaptics';
import AppText from './AppText';
import { FieldLabel } from './FormField';
import Sheet from './Sheet';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';

// Tappable field that opens a searchable picker sheet.
// options: { value, label, description?, leading? }[]
export default function SelectField({
  label,
  placeholder = 'Seçin',
  value,
  options,
  onChange,
  error,
  required,
  searchable = true,
  icon,
  footer,
  disabled,
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const haptics = useHaptics();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find(o => o.value === value);

  const filtered = useMemo(
    () => options.filter(o => matchesSearch(query, o.label, o.description)),
    [options, query]
  );

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        style={({ pressed }) => [styles.field, error && styles.error, pressed && styles.pressed, disabled && styles.disabled]}
      >
        {icon ? <Feather name={icon} size={17} color={colors.textTertiary} /> : null}
        <View style={styles.flex}>
          <AppText variant="body" color={selected ? 'primary' : 'tertiary'} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </AppText>
          {selected?.description ? (
            <AppText variant="small" color="secondary" numberOfLines={1}>
              {selected.description}
            </AppText>
          ) : null}
        </View>
        <Feather name="chevron-down" size={18} color={colors.textTertiary} />
      </Pressable>
      {error ? (
        <AppText variant="small" color="danger" style={styles.message}>
          {error}
        </AppText>
      ) : null}

      <Sheet visible={open} title={label || placeholder} onClose={close} scroll={false} maxHeight="80%">
        {searchable && options.length > 6 ? (
          <SearchBar value={query} onChangeText={setQuery} placeholder="Ara..." style={styles.search} />
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={o => String(o.value)}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ListEmptyComponent={<EmptyState icon="search" title="Sonuç yok" compact />}
          renderItem={({ item }) => {
            const isSelected = item.value === value;
            return (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  onChange(item.value);
                  close();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                {item.leading}
                <View style={styles.flex}>
                  <AppText variant="bodyMedium" color={isSelected ? 'brand' : 'primary'}>
                    {item.label}
                  </AppText>
                  {item.description ? (
                    <AppText variant="small" color="secondary">
                      {item.description}
                    </AppText>
                  ) : null}
                </View>
                {isSelected ? <Feather name="check" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
        {footer}
      </Sheet>
    </View>
  );
}

const makeStyles = t => ({
  wrapper: { marginBottom: 14 },
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
    paddingVertical: 10,
  },
  error: { borderColor: t.colors.danger },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  message: { marginTop: 5 },
  search: { marginBottom: 8 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
});
