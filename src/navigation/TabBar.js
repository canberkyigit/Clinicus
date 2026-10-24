import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles, useTheme } from '../shared/theme/ThemeProvider';
import { useHaptics } from '../shared/hooks/useHaptics';
import AppText from '../shared/components/AppText';
import QuickActionsSheet from './QuickActionsSheet';

// Docked tab bar with a raised centre "+" that opens quick actions. The centre
// slot is inserted after the second tab.
export default function TabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [quickOpen, setQuickOpen] = useState(false);

  const renderTab = (route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const color = focused ? colors.primary : colors.textTertiary;
    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name);
          }
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={options.title}
        style={styles.tab}
      >
        <View>
          {options.tabBarIcon?.({ focused, color, size: 22 })}
          {options.tabBarBadge ? <View style={styles.badgeDot} /> : null}
        </View>
        <AppText variant="caption" color={color} style={styles.label}>
          {options.title}
        </AppText>
      </Pressable>
    );
  };

  const tabs = state.routes.map(renderTab);

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {tabs.slice(0, 2)}
        <View style={styles.tab}>
          <Pressable
            onPress={() => {
              haptics.light();
              setQuickOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Hızlı işlemler"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <Feather name="plus" size={26} color={colors.onPrimary} />
          </Pressable>
        </View>
        {tabs.slice(2)}
      </View>
      <QuickActionsSheet
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSelect={(name, params) => {
          setQuickOpen(false);
          navigation.navigate(name, params);
        }}
      />
    </>
  );
}

const makeStyles = t => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { letterSpacing: 0.1 },
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.danger,
    borderWidth: 1.5,
    borderColor: t.colors.surface,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginTop: -22,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: t.colors.background,
    ...t.shadow,
    shadowColor: t.colors.primary,
    shadowOpacity: 0.35,
  },
  fabPressed: { transform: [{ scale: 0.94 }] },
});
