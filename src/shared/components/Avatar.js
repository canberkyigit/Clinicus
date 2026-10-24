import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { initials } from '../utils/format';
import AppText from './AppText';

const TONES = ['success', 'info', 'purple', 'warning', 'danger'];

function toneFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

// Image avatar that falls back to coloured initials when there is no image or
// it fails to load. The colour is stable per name.
export default function Avatar({ uri, name, size = 44, ring = false, style }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const tone = toneFor(name);
  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(ring && { borderWidth: 2, borderColor: colors.primary }),
  };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[base, { backgroundColor: colors.surfaceAlt }, style]}
        onError={() => setFailed(true)}
        accessibilityLabel={name}
      />
    );
  }
  return (
    <View
      style={[base, { backgroundColor: colors[`${tone}Muted`], alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityLabel={name}
    >
      <AppText variant="bodyMedium" color={colors[tone]} style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}>
        {initials(name)}
      </AppText>
    </View>
  );
}
