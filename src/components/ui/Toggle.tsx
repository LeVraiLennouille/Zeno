import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

/** Interrupteur 54 × 32 de la page Compte (pouce de 26 px, blanc éteint / fond du thème allumé). */
export function Toggle({
  value,
  onChange,
  label,
}: {
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly label: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{ width: 54, height: 32, borderRadius: 16, backgroundColor: value ? colors.text : colors.borderStrong }}
    >
      <View style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 26, height: 26, borderRadius: 13, backgroundColor: value ? colors.bg : '#FFFFFF' }} />
    </Pressable>
  );
}
