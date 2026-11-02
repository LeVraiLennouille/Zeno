import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

/** Interrupteur 54 × 32 de la page Compte. */
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
      style={{ width: 54, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: value ? colors.text : colors.borderStrong }}
    >
      <View style={{ position: 'absolute', left: value ? 25 : 5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bg }} />
    </Pressable>
  );
}
