import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import AppText from '../AppText';
import { arcPath, donutSegments } from './chartUtils';

// Donut with a centre label and a legend listing each slice's share.
// data: { label, value }[]
export default function DonutChart({ data, size = 140, stroke = 18, centerLabel, centerValue, legend = true }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const segments = donutSegments(data).map((s, i) => ({ ...s, color: s.color || colors.chart[i % colors.chart.length] }));
  const r = (size - stroke) / 2;
  const c = size / 2;
  // Small visual gap between slices when there's more than one.
  const gapAngle = segments.length > 1 ? 0.025 : 0;

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
          {segments.map(s =>
            s.fraction >= 0.999 ? (
              <Circle key={s.label} cx={c} cy={c} r={r} stroke={s.color} strokeWidth={stroke} fill="none" />
            ) : (
              <Path
                key={s.label}
                d={arcPath(c, c, r, s.start + gapAngle / 2, Math.max(s.start + gapAngle / 2, s.end - gapAngle / 2))}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="butt"
              />
            )
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {centerValue !== undefined ? (
            <AppText variant="h3" numberOfLines={1} adjustsFontSizeToFit style={styles.centerText}>
              {centerValue}
            </AppText>
          ) : null}
          {centerLabel ? (
            <AppText variant="caption" color="tertiary">
              {centerLabel}
            </AppText>
          ) : null}
        </View>
      </View>
      {legend ? (
        <View style={styles.legend}>
          {segments.map(s => (
            <View key={s.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <AppText variant="small" color="secondary" style={styles.legendLabel} numberOfLines={1}>
                {s.label}
              </AppText>
              <AppText variant="smallMedium">%{Math.round(s.fraction * 100)}</AppText>
            </View>
          ))}
          {segments.length === 0 ? (
            <AppText variant="small" color="tertiary">
              Veri yok
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = () => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 22 },
  centerText: { textAlign: 'center' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { flex: 1 },
});
