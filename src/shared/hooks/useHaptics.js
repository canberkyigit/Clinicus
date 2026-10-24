import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppData } from '../context/AppDataContext';

const noop = () => {};

// Haptic feedback that respects the user's "haptics" setting. Errors are
// swallowed because some devices/simulators don't support haptics.
export function useHaptics() {
  const enabled = useAppData().settings.haptics;
  return useMemo(() => {
    if (!enabled) return { light: noop, selection: noop, success: noop, warning: noop, error: noop };
    const safe = fn => () => Promise.resolve().then(fn).catch(noop);
    return {
      light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      selection: safe(() => Haptics.selectionAsync()),
      success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
      error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    };
  }, [enabled]);
}
