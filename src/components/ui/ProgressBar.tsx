import { View } from 'react-native';

import { useTheme } from '@/theme';

/** Barre de progression 0-100 ; `thin` pour les listes. */
export function ProgressBar({
  pct,
  color,
  thin = false,
  label,
}: {
  readonly pct: number;
  readonly color?: string;
  readonly thin?: boolean;
  readonly label?: string;
}) {
  const { colors } = useTheme();
  const height = thin ? 6 : 14;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={{ height, borderRadius: height / 2, backgroundColor: colors.accentBg, overflow: 'hidden' }}
    >
      <View style={{ width: `${clamped}%`, height, borderRadius: height / 2, backgroundColor: color ?? colors.accent }} />
    </View>
  );
}
