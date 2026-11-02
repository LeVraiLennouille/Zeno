import { Pressable, StyleSheet, View } from 'react-native';

import type { MyHabitRow as Row } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { HabitBadge } from '../ui/HabitBadge';

/** Mode « réorganiser » : flèches haut / bas, accessibles au clavier et aux lecteurs d'écran. */
export function ReorderRow({
  row,
  position,
  total,
  onMove,
}: {
  readonly row: Row;
  readonly position: number;
  readonly total: number;
  readonly onMove: (delta: -1 | 1) => void;
}) {
  const { colors } = useTheme();
  const btn = (delta: -1 | 1, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${delta < 0 ? 'Monter' : 'Descendre'} ${row.habit.name}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onMove(delta)}
      style={[styles.arrow, { borderColor: colors.borderStrong, opacity: disabled ? 0.3 : 1 }]}
    >
      <Icon name={delta < 0 ? 'arrowUp' : 'arrowDown'} size={20} color={colors.text} />
    </Pressable>
  );
  return (
    <View
      accessible={false}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <HabitBadge habit={row.habit} size={40} />
      <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
        {row.habit.name}
      </AppText>
      <AppText variant="caption" tone="text3">
        {position}/{total}
      </AppText>
      {btn(-1, position === 1)}
      {btn(1, position === total)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
  arrow: { width: 40, height: 40, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
