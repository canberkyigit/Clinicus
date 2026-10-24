import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles, useTheme } from '../theme/ThemeProvider';
import AppText from './AppText';

const ToastContext = createContext({ show: () => {} });

const ICONS = { success: 'check-circle', danger: 'alert-circle', warning: 'alert-triangle', info: 'info' };

// Lightweight snackbar for action feedback ("Randevu oluşturuldu").
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, { tone = 'success', action, duration = 2600 } = {}) => {
    clearTimeout(timer.current);
    setToast({ message, tone, action, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.key} toast={toast} onDismiss={() => setToast(null)} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDismiss }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  }, [anim]);

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.host, { paddingTop: insets.top + 8 }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          styles.toast,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
          },
        ]}
      >
        <Feather name={ICONS[toast.tone] || 'info'} size={18} color={colors[toast.tone] || colors.info} />
        <AppText variant="smallMedium" style={styles.message}>
          {toast.message}
        </AppText>
        {toast.action ? (
          <Pressable
            onPress={() => {
              toast.action.onPress();
              onDismiss();
            }}
            hitSlop={8}
          >
            <AppText variant="smallMedium" color="brand">
              {toast.action.label}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const makeStyles = t => ({
  host: { alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '92%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    ...t.shadow,
    shadowOpacity: 0.2,
  },
  message: { flexShrink: 1 },
});
