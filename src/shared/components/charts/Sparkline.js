import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { buildLinePath } from './chartUtils';

export default function Sparkline({ data, color, height = 32, style }) {
  const [width, setWidth] = useState(0);
  const { line, area } = buildLinePath(data, width, height, 2);
  return (
    <View style={[{ height }, style]} onLayout={e => setWidth(e.nativeEvent.layout.width)} accessible={false}>
      {width > 0 && data.length > 1 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#spark)" />
          <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}
