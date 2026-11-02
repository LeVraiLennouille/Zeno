import { type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

const SIZE = 300;
const RADIUS = 140;
const CIRCUMFERENCE = 880;

/** Anneau de progression + orbe central (animé par `scale`) + contenu centré (compte à rebours). */
export function BreathOrb({
  scale,
  progress,
  size = 260,
  children,
}: {
  readonly scale: Animated.Value;
  /** 0-1, `null` = pas d'anneau de progression. */
  readonly progress: number | null;
  readonly size?: number;
  readonly children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]} accessibilityElementsHidden>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={150} cy={150} r={RADIUS} stroke={colors.border} strokeWidth={6} fill="none" />
        {progress !== null ? (
          <Circle
            cx={150}
            cy={150}
            r={RADIUS}
            stroke={colors.accent}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        ) : null}
      </Svg>
      </View>
      <Animated.View
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: size,
          backgroundColor: colors.accentBg,
          transform: [{ scale }],
        }}
      />
      <Animated.View
        accessibilityElementsHidden
        style={{ position: 'absolute', width: size * 0.4, height: size * 0.4, borderRadius: size, backgroundColor: colors.accent, opacity: 0.9, transform: [{ scale }] }}
      />
      {children}
    </View>
  );
}
