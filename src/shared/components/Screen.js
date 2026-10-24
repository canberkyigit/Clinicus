import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import ScreenHeader from './ScreenHeader';

// Standard screen scaffold: themed background, safe-area aware header and an
// optional scroll container. `tabBar` adds bottom clearance for the tab bar.
export default function Screen({
  title,
  subtitle,
  large = false,
  onBack,
  right,
  scroll = true,
  tabBar = false,
  onRefresh,
  refreshing = false,
  contentStyle,
  headerBelow,
  children,
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = (tabBar ? 96 : 32) + insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {title !== undefined ? (
        <ScreenHeader title={title} subtitle={subtitle} large={large} onBack={onBack} right={right} />
      ) : null}
      {headerBelow}
      {scroll ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[{ paddingHorizontal: spacing.screen, paddingBottom: bottom }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

export function useTabBarPadding() {
  const insets = useSafeAreaInsets();
  return 96 + insets.bottom;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
