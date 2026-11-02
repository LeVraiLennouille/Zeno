import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { currentMonthRef, MOOD_EMOJIS, moodCalendar, shiftMonth, type MonthRef } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useCtx } from '@/state/react';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';

/** Calendrier d'humeur du mois : un emoji par jour renseigné, « + » pour compléter un jour passé. */
export function MoodCalendarView() {
  const ctx = useCtx();
  const router = useRouter();
  const { colors } = useTheme();
  const [ref, setRef] = useState<MonthRef>(() => currentMonthRef(ctx));
  const cal = useMemo(() => moodCalendar(ctx, ref), [ctx, ref]);

  const nav = (delta: -1 | 1, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={delta < 0 ? 'Mois précédent' : 'Mois suivant'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => setRef((r) => shiftMonth(ctx, r, delta))}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      <Icon name={delta < 0 ? 'chevronLeft' : 'chevronRight'} size={22} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.head}>
        {nav(-1, false)}
        <AppText variant="heading" accessibilityLiveRegion="polite">
          {cal.title}
        </AppText>
        {nav(1, !cal.canGoNext)}
      </View>
      <View style={styles.row}>
        {cal.headers.map((h) => (
          <AppText key={h} variant="caption" tone="text3" style={styles.cell}>
            {h}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: cal.leading }, (_, i) => (
          <View key={`b${i}`} style={styles.cell} />
        ))}
        {cal.cells.map((c) => {
          if (c.kind === 'future') {
            return (
              <View key={c.day} style={styles.cell}>
                <AppText variant="caption" tone="text3" style={{ opacity: 0.3, textAlign: 'center' }}>
                  {c.day}
                </AppText>
              </View>
            );
          }
          const label = c.kind === 'mood' ? `${c.day}, humeur enregistrée${c.hasNote ? ', avec note' : ''}` : `${c.day}, ajouter l'humeur`;
          return (
            <Pressable
              key={c.day}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => router.push({ pathname: '/mood', params: { date: c.date, step: c.kind === 'mood' ? '2' : '1' } })}
              style={[styles.cell, styles.pressable, { borderColor: c.kind === 'mood' ? colors.border : colors.borderStrong, borderStyle: c.kind === 'mood' ? 'solid' : 'dashed' }]}
            >
              <AppText variant="caption" tone="text3" style={{ fontSize: 10, lineHeight: 12 }}>
                {c.day}
              </AppText>
              <AppText style={{ fontSize: 18, lineHeight: 22 }}>{c.kind === 'mood' ? MOOD_EMOJIS[c.mood] : '+'}</AppText>
              {c.kind === 'mood' && c.hasNote ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 2, alignItems: 'center' },
  pressable: { aspectRatio: 1, borderWidth: 1.5, borderRadius: 10, justifyContent: 'center', alignItems: 'center', width: `${100 / 7 - 1}%`, margin: `${0.5}%` },
  dot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3 },
});
