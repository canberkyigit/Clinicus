import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';

export default function SearchBar({ value, onChangeText, placeholder = 'Ara', autoFocus, style, accessibilityLabel }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.bar, style]}>
      <Feather name="search" size={17} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
        accessibilityLabel={accessibilityLabel || placeholder}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Aramayı temizle">
          <Feather name="x-circle" size={17} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = t => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceAlt,
  },
  input: { flex: 1, color: t.colors.text, fontFamily: t.fonts.regular, fontSize: 15, paddingVertical: 0 },
});
