import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';
import FormField, { FieldLabel } from './FormField';

// Editable list of tags with quick-pick suggestions.
export default function TagInput({ label, value = [], onChange, suggestions = [], tone = 'info', placeholder = 'Ekle...' }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [text, setText] = useState('');

  const add = raw => {
    const tag = raw.trim();
    if (!tag || value.some(v => v.toLocaleLowerCase('tr-TR') === tag.toLocaleLowerCase('tr-TR'))) return;
    onChange([...value, tag]);
    setText('');
  };
  const remove = tag => onChange(value.filter(v => v !== tag));
  const remaining = suggestions.filter(s => !value.includes(s));

  return (
    <View style={styles.wrapper}>
      {label ? <FieldLabel label={label} /> : null}
      {value.length ? (
        <View style={styles.tags}>
          {value.map(tag => (
            <Pressable
              key={tag}
              onPress={() => remove(tag)}
              accessibilityRole="button"
              accessibilityLabel={`${tag} kaldır`}
              style={[styles.tag, { backgroundColor: colors[`${tone}Muted`] }]}
            >
              <AppText variant="smallMedium" color={colors[tone]}>
                {tag}
              </AppText>
              <Feather name="x" size={13} color={colors[tone]} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <FormField
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => add(text)}
        returnKeyType="done"
        blurOnSubmit={false}
        style={styles.field}
        accessibilityLabel={label}
        right={
          text.trim() ? (
            <Pressable onPress={() => add(text)} style={styles.addBtn} accessibilityLabel="Ekle">
              <Feather name="plus" size={18} color={colors.primary} />
            </Pressable>
          ) : null
        }
      />
      {remaining.length ? (
        <View style={styles.tags}>
          {remaining.map(s => (
            <Pressable key={s} onPress={() => add(s)} style={styles.suggestion} accessibilityRole="button" accessibilityLabel={`${s} ekle`}>
              <Feather name="plus" size={12} color={colors.textTertiary} />
              <AppText variant="small" color="secondary">
                {s}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = t => ({
  wrapper: { marginBottom: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  field: { marginBottom: 8 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: t.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: t.colors.borderStrong,
  },
});
