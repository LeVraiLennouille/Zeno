import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MyHabitRow as Row } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { HabitBadge } from '../ui/HabitBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { HabitToggleButton } from './HabitToggleButton';

/** Ligne de « Mes habitudes » : état du jour, série, accès à la modification. */
export function MyHabitRowView({ row }: { readonly row: Row }) {
  const store = useStore();
  const { colors } = useTheme();
  const { habit } = row;
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Link href={{ pathname: '/detail/[id]', params: { id: habit.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={`Fiche de ${habit.name}`}>
          <HabitBadge habit={habit} />
        </Pressable>
      </Link>
      <View style={styles.info}>
        <AppText variant="heading" numberOfLines={1}>
          {habit.name}
        </AppText>
        <View style={styles.meta}>
          <AppText variant="caption" tone="text2" numberOfLines={1} style={{ flexShrink: 1 }}>
            {row.meta}
          </AppText>
          <Icon name="flame" size={13} color={colors.orange} />
          <AppText variant="caption" tone="text2">
            {row.streak}
          </AppText>
        </View>
        {row.progressPct !== null ? <ProgressBar thin pct={row.progressPct} color={habit.color} label={habit.name} /> : null}
      </View>
      <Link href={{ pathname: '/habit/[id]', params: { id: habit.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={`Modifier ${habit.name}`} hitSlop={8} style={styles.edit}>
          <Icon name="edit" size={20} color={colors.text2} />
        </Pressable>
      </Link>
      <HabitToggleButton
        name={habit.name}
        done={row.done}
        size={44}
        interactive={row.canToggle}
        onPress={() => store.toggleHabit(habit.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  edit: { padding: 6 },
});
