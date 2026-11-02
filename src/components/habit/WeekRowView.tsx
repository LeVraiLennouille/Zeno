import { Pressable, StyleSheet, View } from 'react-native';

import type { WeekCell, WeekRow } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useStore } from '@/state/react';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { CheckMark } from '../ui/CheckMark';

/** Une habitude sur 7 jours : toucher un jour passé ou présent le coche (sans XP). */
export function WeekRowView({ row }: { readonly row: WeekRow }) {
  const store = useStore();
  const { colors } = useTheme();
  const { habit } = row;
  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flexShrink: 1 }}>
          <AppText variant="heading" numberOfLines={1}>
            {habit.name}
          </AppText>
          <AppText variant="caption" tone="text2">
            {row.freqText}
          </AppText>
        </View>
        <View style={styles.streak}>
          <Icon name="flame" size={14} color={colors.orange} />
          <AppText variant="caption" tone="text2">
            {row.streak}
          </AppText>
        </View>
      </View>
      <View style={styles.days}>
        {row.cells.map((cell) => (
          <DayDot key={cell.date} cell={cell} color={habit.color} name={habit.name} onPress={() => store.toggleHabitOnDate(habit.id, cell.date)} />
        ))}
      </View>
    </Card>
  );
}

function DayDot({ cell, color, name, onPress }: { readonly cell: WeekCell; readonly color: string; readonly name: string; readonly onPress: () => void }) {
  const { colors } = useTheme();
  const borderColor = cell.done ? color : cell.active ? `${color}50` : colors.border;
  return (
    <View style={styles.cell}>
      <AppText
        variant="caption"
        style={{
          color: cell.isToday || cell.isSunday ? colors.text : colors.text2,
          fontFamily: cell.isToday ? 'Instrument-Bold' : 'Instrument-SemiBold',
          textDecorationLine: cell.isToday ? 'underline' : 'none',
        }}
      >
        {cell.label}
      </AppText>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${name}, ${cell.label} ${cell.date}`}
        accessibilityState={{ checked: cell.done, disabled: !cell.tappable }}
        disabled={!cell.tappable}
        onPress={onPress}
        style={[
          styles.dot,
          {
            borderColor,
            backgroundColor: cell.done ? color : 'transparent',
            opacity: cell.active ? 1 : 0.35,
            borderStyle: cell.paused ? 'dashed' : 'solid',
          },
        ]}
      >
        {cell.done ? <CheckMark color={colors.inkText} size={18} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  cell: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
