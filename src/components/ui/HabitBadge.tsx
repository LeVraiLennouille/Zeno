import { Text, View } from 'react-native';

import type { Habit } from '@/domain';
import { HABIT_ICON_NODES } from '@/icons/icon-data';
import { Icon, type AnyIconName } from '@/icons/Icon';
import { useTheme } from '@/theme';

/** Pastille colorée de l'habitude : icône SVG pour les habitudes livrées, emoji pour les autres. */
export function HabitBadge({ habit, size = 44 }: { readonly habit: Pick<Habit, 'id' | 'emoji' | 'color' | 'custom'>; readonly size?: number }) {
  const { colors } = useTheme();
  const useSvg = !habit.custom && habit.id in HABIT_ICON_NODES;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: habit.color, alignItems: 'center', justifyContent: 'center' }}
    >
      {useSvg ? (
        <Icon name={habit.id as AnyIconName} size={size * 0.55} color={colors.inkText} />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{habit.emoji}</Text>
      )}
    </View>
  );
}
