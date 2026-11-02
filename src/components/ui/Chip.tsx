import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Puce sélectionnable (paliers d'écart, jours, couleurs d'emoji…). `tone="danger"` pour les écarts. */
export function Chip({
  label,
  selected,
  onPress,
  tone = 'neutral',
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly tone?: 'neutral' | 'danger';
}) {
  const { colors } = useTheme();
  const on = tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        borderColor: selected ? on : colors.borderStrong,
        backgroundColor: selected ? on : 'transparent',
      }}
    >
      <AppText variant="bodyStrong" style={{ color: selected ? (tone === 'danger' ? '#FFFFFF' : colors.onAccent) : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}
