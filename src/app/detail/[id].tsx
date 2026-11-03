import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LineChart, RATE_CHART } from '@/components/charts/LineChart';
import { RichLine } from '@/components/report/InsightsCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HabitBadge } from '@/components/ui/HabitBadge';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { clampDetailYear, detailModel, type DetailCell } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useCtx } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

const CELL = 12;
const GAP = 3;

function cellStyle(cell: DetailCell, color: string, border: string, danger: string): { backgroundColor: string; opacity?: number; borderWidth?: number; borderColor?: string; borderStyle?: 'dashed' } {
  switch (cell.c) {
    case 'done':
      return { backgroundColor: color };
    case 'part':
      return { backgroundColor: color, opacity: Math.max(0.25, cell.a ?? 0.5) };
    case 'fail':
      return { backgroundColor: danger };
    case 'miss':
      return { backgroundColor: border };
    case 'rest':
      return { backgroundColor: border, opacity: 0.4 };
    case 'paused':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: border, borderStyle: 'dashed' };
    case 'off':
      return { backgroundColor: border, opacity: 0.18 };
    default:
      return { backgroundColor: 'transparent' };
  }
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ctx = useCtx();
  const { colors } = useTheme();
  const [year, setYear] = useState<number | undefined>(undefined);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const m = id ? detailModel(ctx, id, year) : null;
  if (!m) return <Redirect href="/habits" />;

  const { habit, grid } = m;
  const shown = grid.year;
  const lastActiveWeek = grid.weeks.reduce((acc, col, i) => (col.some((c) => c !== null && c.cell.c !== 'future') ? i : acc), 0);

  return (
    <ModalScreen title={habit.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <HabitBadge habit={habit} size={52} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{habit.name}</AppText>
          <AppText variant="caption" tone="text2">
            {m.freqText}
          </AppText>
        </View>
        <Link href={{ pathname: '/habit/[id]', params: { id: habit.id } }} asChild>
          <Button label="Modifier" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} />
        </Link>
      </View>

      <View style={styles.tiles}>
        {m.tiles.map((t) => (
          <Card key={t.label} shadow={false} style={styles.tile}>
            <AppText variant="title" style={{ textAlign: 'center' }}>
              {t.value}
            </AppText>
            <AppText variant="caption" tone="text2" style={{ textAlign: 'center' }}>
              {t.label}
            </AppText>
          </Card>
        ))}
      </View>

      {m.moodNote ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <AppText variant="title">{m.moodNote.emoji}</AppText>
          <View style={{ flex: 1 }}>
            <RichLine parts={m.moodNote.parts} />
          </View>
        </View>
      ) : null}

      {m.levels.length > 0 ? (
        <View style={{ gap: 8 }}>
          <AppText variant="label" tone="text3">
            Répartition des écarts
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {m.levels.map((l) => (
              <View key={l.level} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: colors.borderStrong }}>
                <AppText variant="bodyStrong">
                  {l.level} {l.count}×
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="heading">Grille {shown}</AppText>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Année précédente" accessibilityState={{ disabled: !m.canPrevYear }} disabled={!m.canPrevYear} onPress={() => setYear(clampDetailYear(ctx, shown - 1))} style={{ opacity: m.canPrevYear ? 1 : 0.3 }}>
              <Icon name="chevronLeft" size={22} color={colors.text} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Année suivante" accessibilityState={{ disabled: !m.canNextYear }} disabled={!m.canNextYear} onPress={() => setYear(clampDetailYear(ctx, shown + 1))} style={{ opacity: m.canNextYear ? 1 : 0.3 }}>
              <Icon name="chevronRight" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollTo({ x: shown === ctx.clock.now().getFullYear() ? Math.max(0, (lastActiveWeek + 1) * (CELL + GAP) - 280) : 0, animated: false })}
          accessible
          accessibilityLabel={`Grille annuelle ${shown} : ${grid.doneCount} jour${grid.doneCount > 1 ? 's' : ''} réussi${grid.doneCount > 1 ? 's' : ''}`}
        >
          <View>
            <View style={{ flexDirection: 'row', height: 16, width: grid.weeks.length * (CELL + GAP) }}>
              {grid.months.map((mo) => (
                <AppText key={`${mo.week}${mo.label}`} variant="caption" tone="text3" style={{ position: 'absolute', left: mo.week * (CELL + GAP), fontSize: 10 }}>
                  {mo.label}
                </AppText>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {grid.weeks.map((col, w) => (
                <View key={w} style={{ gap: GAP }}>
                  {col.map((c, d) => (
                    <View key={d} style={[{ width: CELL, height: CELL, borderRadius: 3 }, c ? cellStyle(c.cell, habit.color, colors.border, colors.danger) : null]} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {(
            [
              ['fait', habit.color, 1],
              ['partiel', habit.color, 0.5],
              ['manqué', colors.border, 1],
            ] as const
          ).map(([label, bg, op]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: bg, opacity: op }} />
              <AppText variant="caption" tone="text2">
                {label}
              </AppText>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: CELL, height: CELL, borderRadius: 3, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border }} />
            <AppText variant="caption" tone="text2">
              pause
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <AppText variant="heading">Jour de la semaine</AppText>
        <View accessible accessibilityRole="image" accessibilityLabel="Taux de réussite par jour de la semaine" style={{ flexDirection: 'row', gap: 8, height: 110, alignItems: 'flex-end' }}>
          {m.weekdays.map((w) => {
            const max = Math.max(1, ...m.weekdays.map((x) => x.rate ?? 0));
            return (
              <View key={w.label} style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <AppText variant="caption" tone="text2">
                  {w.rate == null ? '–' : w.rate}
                </AppText>
                <View style={{ width: '100%', height: `${w.rate == null ? 0 : Math.max(4, Math.round((w.rate / max) * 70))}%`, borderRadius: 6, backgroundColor: habit.color }} />
                <AppText variant="caption" tone="text3">
                  {w.label[0]}
                </AppText>
              </View>
            );
          })}
        </View>
        <RichLine parts={m.weekdayText} />
      </View>

      <View style={{ gap: 10 }}>
        <AppText variant="heading">Évolution · 26 semaines</AppText>
        <LineChart points={m.trend} {...RATE_CHART} dotRadius={2.5} label="Évolution hebdomadaire" />
      </View>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 2 },
});
