import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import AppText from '../AppText';
import { niceMax, smoothPath } from './chartUtils';

const HEIGHT = 170;
const AXIS = 18;

// Line + gradient area chart. Drag a finger across it to read exact values.
// data: { label, value }[]; formatValue formats the tooltip value.
export default function AreaChart({ data, formatValue = String, color, compareData, labelEvery = 1 }) {
  const { colors, fonts } = useTheme();
  const styles = useStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  const stroke = color || colors.primary;
  const values = data.map(d => d.value);
  // Both series share one rounded axis maximum so they're comparable.
  const top = niceMax(Math.max(...values, ...(compareData || []).map(d => d.value), 1));
  const chartH = HEIGHT - AXIS;

  const yFor = v => 4 + (1 - v / top) * (chartH - 8);
  const xFor = i => 4 + (i / Math.max(values.length - 1, 1)) * (width - 8);
  const pathFor = series => smoothPath(series.map((v, i) => ({ x: xFor(i), y: yFor(v) })), chartH);
  const mainPath = pathFor(values);
  const comparePath = compareData ? pathFor(compareData.map(d => d.value)) : null;

  const handleTouch = e => {
    if (!width) return;
    const x = e.nativeEvent.locationX;
    const index = Math.round(((x - 4) / (width - 8)) * (values.length - 1));
    setActive(Math.max(0, Math.min(values.length - 1, index)));
  };

  const activePoint = active !== null ? data[active] : null;

  return (
    <View>
      <View style={styles.tooltipRow}>
        {activePoint ? (
          <>
            <AppText variant="smallMedium" color="secondary">
              {activePoint.tooltipLabel || activePoint.label}
            </AppText>
            <AppText variant="h3">{formatValue(activePoint.value)}</AppText>
          </>
        ) : (
          <AppText variant="small" color="tertiary">
            Değer görmek için grafiğe dokunun
          </AppText>
        )}
      </View>
      <View
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setTimeout(() => setActive(null), 1500)}
        style={{ height: HEIGHT }}
        accessibilityLabel="Gelir grafiği"
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
                <Stop offset="1" stopColor={stroke} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 0.5, 1].map(p => (
              <Line key={p} x1={0} x2={width} y1={4 + p * (chartH - 8)} y2={4 + p * (chartH - 8)} stroke={colors.border} strokeDasharray="4 4" />
            ))}
            {comparePath ? (
              <Path d={comparePath.line} stroke={colors.textTertiary} strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
            ) : null}
            <Path d={mainPath.area} fill="url(#area)" />
            <Path d={mainPath.line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {active !== null ? (
              <>
                <Line x1={xFor(active)} x2={xFor(active)} y1={0} y2={chartH} stroke={colors.borderStrong} />
                <Circle cx={xFor(active)} cy={yFor(values[active])} r={5} fill={colors.surface} stroke={stroke} strokeWidth={2.5} />
              </>
            ) : null}
            {data.map((d, i) =>
              i % labelEvery === 0 || i === data.length - 1 ? (
                <SvgText
                  key={d.key || i}
                  x={xFor(i)}
                  y={HEIGHT - 3}
                  fontSize={10}
                  fontFamily={fonts.medium}
                  fill={colors.textTertiary}
                  textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                >
                  {d.label}
                </SvgText>
              ) : null
            )}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = () => ({
  tooltipRow: { height: 40, justifyContent: 'center' },
});
