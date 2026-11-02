import { StyleSheet, View } from 'react-native';

import { DAY_SHORT, type OverallCell, type OverallRow } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';

/** 16 semaines d'une habitude : une ligne par jour de la semaine, un point par jour. */
export function OverallRowView({ row }: { readonly row: OverallRow }) {
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
      <View
        accessible
        accessibilityLabel={`Historique de ${habit.name} sur 16 semaines`}
        style={styles.grid}
      >
        {row.grid.map((line, p) => (
          <View key={p} style={styles.line}>
            <AppText variant="caption" tone="text3" style={styles.label}>
              {DAY_SHORT[p]?.[0]}
            </AppText>
            {line.map((cell) => (
              <Dot key={cell.date} cell={cell} color={habit.color} />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

function Dot({ cell, color }: { readonly cell: OverallCell; readonly color: string }) {
  const { colors } = useTheme();
  let style: { backgroundColor: string; opacity?: number; borderWidth?: number; borderColor?: string; borderStyle?: 'dashed' } = {
    backgroundColor: colors.border,
  };
  if (cell.state === 'inactive') {
    style = cell.paused
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong, borderStyle: 'dashed' }
      : { backgroundColor: 'transparent' };
  } else if (cell.state === 'failed') style = { backgroundColor: colors.danger };
  else if (cell.state === 'done') style = { backgroundColor: color };
  else if (cell.state === 'missed') style = { backgroundColor: color, opacity: 0.22 };
  return <View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  grid: { gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { width: 12, textAlign: 'center', fontSize: 10, lineHeight: 12 },
  dot: { flex: 1, aspectRatio: 1, borderRadius: 4 },
});
