import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles } from '../theme/ThemeProvider';
import AppText from './AppText';
import Button from './Button';

// Full-screen modal form: "Vazgeç | Title | Kaydet" header, keyboard-aware
// scroll body and a sticky primary button at the bottom.
export default function FormScreen({ title, onCancel, onSubmit, submitLabel = 'Kaydet', submitting, footerExtra, children }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 8 : 14 }]}>
        <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" style={styles.side}>
          <AppText variant="bodyMedium" color="secondary">
            Vazgeç
          </AppText>
        </Pressable>
        <AppText variant="h3" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
        <Pressable onPress={onSubmit} hitSlop={10} accessibilityRole="button" style={[styles.side, styles.right]}>
          <AppText variant="bodyMedium" color="brand">
            {submitLabel}
          </AppText>
        </Pressable>
      </View>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {footerExtra}
        <Button title={submitLabel} onPress={onSubmit} loading={submitting} icon="check" />
      </View>
    </KeyboardAvoidingView>
  );
}

export function FormSection({ title, children }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="caption" color="tertiary" style={styles.sectionTitle}>
          {title.toLocaleUpperCase('tr-TR')}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

export function FormRow({ children }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

const makeStyles = t => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.screen,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  side: { width: 76 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  content: { padding: t.spacing.screen, paddingBottom: 40 },
  section: { marginBottom: 10 },
  sectionTitle: { marginBottom: 10, marginTop: 6 },
  footer: {
    paddingHorizontal: t.spacing.screen,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.background,
  },
});
