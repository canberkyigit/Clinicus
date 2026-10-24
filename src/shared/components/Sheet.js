import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles } from '../theme/ThemeProvider';
import AppText from './AppText';
import IconButton from './IconButton';

// Bottom sheet with grabber, title, scrollable body and optional footer.
export default function Sheet({ visible, title, subtitle, onClose, children, footer, scroll = true, maxHeight = '88%' }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
          <View style={[styles.sheet, { maxHeight, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.grabber} />
            {title ? (
              <View style={styles.header}>
                <View style={styles.flex}>
                  <AppText variant="h2" numberOfLines={2}>
                    {title}
                  </AppText>
                  {subtitle ? (
                    <AppText variant="small" color="secondary">
                      {subtitle}
                    </AppText>
                  ) : null}
                </View>
                <IconButton icon="x" onPress={onClose} accessibilityLabel="Kapat" variant="tinted" size={18} />
              </View>
            ) : null}
            <Body
              style={styles.body}
              {...(scroll && {
                keyboardShouldPersistTaps: 'handled',
                showsVerticalScrollIndicator: false,
                contentContainerStyle: styles.bodyContent,
              })}
            >
              {children}
            </Body>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = t => ({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: t.colors.background,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    paddingHorizontal: t.spacing.screen,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.borderStrong,
    marginTop: 8,
    marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { paddingBottom: 8 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 12 },
});
