import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function ProgressBar({ value, max = 1, tone = 'primary', height = 6, style }) {
  const { colors } = useTheme();
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View
      style={[{ height, borderRadius: height / 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      <View style={{ width: `${ratio * 100}%`, height, borderRadius: height / 2, backgroundColor: colors[tone] }} />
    </View>
  );
}
