import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import AppText from '../AppText';
import { niceMax } from './chartUtils';

const HEIGHT = 170;
const AXIS = 18;

// Vertical bars with up to two series per group (e.g. income vs expense).
// data: { key, label, values: number[] }[]; series: { label, color }[]
export default function BarChart({ data, series, formatValue = String, height = HEIGHT }) {
  const { colors, fonts } = useTheme();
  const styles = useStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  const chartH = height - AXIS;
  const top = niceMax(Math.max(1, ...data.flatMap(d => d.values)));
  const groupW = width / Math.max(data.length, 1);
  const gap = 3;
  const barW = Math.max(3, Math.min(18, (groupW * 0.62 - gap * (series.length - 1)) / series.length));

  const activeGroup = active !== null ? data[active] : null;

  return (
    <View>
      <View style={styles.legend}>
        {activeGroup ? (
          <AppText variant="smallMedium" color="secondary">
            {activeGroup.tooltipLabel || activeGroup.label}:{' '}
            {series.map((s, i) => `${s.label} ${formatValue(activeGroup.values[i])}`).join(' · ')}
          </AppText>
        ) : (
          series.map(s => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <AppText variant="small" color="secondary">
                {s.label}
              </AppText>
            </View>
          ))
        )}
      </View>
      <View style={{ height }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {[0, 0.5, 1].map(p => (
              <Line key={p} x1={0} x2={width} y1={p * chartH} y2={p * chartH} stroke={colors.border} strokeDasharray="4 4" />
            ))}
            {data.map((group, gi) => {
              const groupX = gi * groupW + (groupW - (barW * series.length + gap * (series.length - 1))) / 2;
              return (
                <React.Fragment key={group.key || gi}>
                  {/* Full-height transparent hit area per group. */}
                  <Rect
                    x={gi * groupW}
                    y={0}
                    width={groupW}
                    height={chartH}
                    fill={active === gi ? colors.surfaceAlt : 'transparent'}
                    rx={6}
                    onPress={() => setActive(active === gi ? null : gi)}
                  />
                  {group.values.map((v, si) => {
                    const h = Math.max(v > 0 ? 2 : 0, (v / top) * (chartH - 4));
                    return (
                      <Rect
                        key={si}
                        x={groupX + si * (barW + gap)}
                        y={chartH - h}
                        width={barW}
                        height={h}
                        rx={Math.min(4, barW / 2)}
                        fill={series[si].color}
                        opacity={active === null || active === gi ? 1 : 0.4}
                        onPress={() => setActive(active === gi ? null : gi)}
                      />
                    );
                  })}
                  <SvgText
                    x={gi * groupW + groupW / 2}
                    y={height - 3}
                    fontSize={10}
                    fontFamily={fonts.medium}
                    fill={colors.textTertiary}
                    textAnchor="middle"
                  >
                    {group.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = () => ({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, minHeight: 28, alignItems: 'center', marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
