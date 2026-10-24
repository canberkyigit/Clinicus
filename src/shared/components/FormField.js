import React, { forwardRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

const FormField = forwardRef(function FormField(
  { label, error, hint, icon, style, inputStyle, right, multiline, required, ...inputProps },
  ref
) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errorBorder]}>
        {icon ? <Feather name={icon} size={17} color={colors.textTertiary} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          keyboardAppearance="default"
          {...inputProps}
          multiline={multiline}
          accessibilityLabel={inputProps.accessibilityLabel || label}
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          onFocus={e => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {right}
      </View>
      {error ? (
        <AppText variant="small" color="danger" style={styles.message}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color="tertiary" style={styles.message}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

export default FormField;

export function FieldLabel({ label, required }) {
  return (
    <AppText variant="smallMedium" color="secondary" style={{ marginBottom: 6 }}>
      {label}
      {required ? <AppText variant="smallMedium" color="danger"> *</AppText> : null}
    </AppText>
  );
}

const makeStyles = t => ({
  wrapper: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    minHeight: 48,
  },
  icon: { marginLeft: 14 },
  focused: { borderColor: t.colors.primary },
  errorBorder: { borderColor: t.colors.danger },
  input: {
    flex: 1,
    color: t.colors.text,
    fontFamily: t.fonts.regular,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  message: { marginTop: 5 },
});
