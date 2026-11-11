import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { LineChart, MOOD_CHART, RATE_CHART } from '@/components/charts/LineChart';
import { InsightsCard } from '@/components/report/InsightsCard';
import { JournalView } from '@/components/report/JournalView';
import { MoodCalendarView } from '@/components/report/MoodCalendarView';
import { ReportCard } from '@/components/report/ReportCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { HeaderActionButton } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import {
  DAY_SHORT,
  defaultReportConfig,
  nextPeriod,
  REPORT_PERIODS,
  reportModel,
  reviewCardModel,
  shiftReport,
  type CalendarStatKind,
  type ReportConfig,
} from '@/domain';
import { fmtNum } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useCtx, useModel } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

function StatTile({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" tone="text2" style={{ textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

function CalendarStats({ cal }: { readonly cal: ReturnType<typeof reportModel>['calendar'] }) {
  const { colors } = useTheme();
  const fill = (kind: CalendarStatKind): { bg: string; fg: string; opacity?: number } => {
    switch (kind) {
      case 'perfect':
        return { bg: colors.success, fg: colors.bg };
      case 'good':
        return { bg: colors.accentBg, fg: colors.text };
      case 'missed':
        return { bg: 'transparent', fg: colors.danger };
      case 'future':
        return { bg: 'transparent', fg: colors.text3, opacity: 0.4 };
      case 'paused':
        return { bg: 'transparent', fg: colors.text3 };
      default:
        return { bg: 'transparent', fg: colors.text2 };
    }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {DAY_SHORT.map((d) => (
          <AppText key={d} variant="caption" tone="text3" style={styles.calCell}>
            {d.slice(0, 2)}
          </AppText>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: cal.leading }, (_, i) => (
          <View key={`b${i}`} style={styles.calCell} />
        ))}
        {cal.cells.map((c) => {
          const f = fill(c.kind);
          return (
            <View key={c.day} style={styles.calCell} accessible accessibilityLabel={`${c.day}${c.title ? `, ${c.title}` : ''}`}>
              <View
                style={{
                  width: '88%',
                  aspectRatio: 1,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: f.bg,
                  opacity: f.opacity ?? 1,
                  borderWidth: c.kind === 'paused' ? 1.5 : 0,
                  borderStyle: 'dashed',
                  borderColor: colors.borderStrong,
                }}
              >
                <AppText variant="caption" style={{ color: f.fg }}>
                  {c.day}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const ctx = useCtx();
  const router = useRouter();
  const { colors } = useTheme();
  const [requested, setRequested] = useState<ReportConfig>(defaultReportConfig);
  const m = reportModel(ctx, requested);
  const card = useModel(reviewCardModel);
  const cfg = m.cfg;
  const set = (p: Partial<ReportConfig>): void => setRequested({ ...cfg, ...p });
  const cycle = (
    <Pressable accessibilityRole="button" accessibilityLabel={`Changer de période (actuelle : ${m.periodLabel})`} onPress={() => set({ period: nextPeriod(cfg.period), offset: 0 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.accentBg }}>
        <AppText variant="caption">{m.periodLabel}</AppText>
        <Icon name="arrowDown" size={12} color={colors.text} />
      </View>
    </Pressable>
  );

  return (
    <Screen
      headerRight={
        <HeaderActionButton label="Saisir l'humeur" onPress={() => router.push('/mood')}>
          <Icon name="mood" size={20} color={colors.text} />
        </HeaderActionButton>
      }
    >
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="tablist">
          {REPORT_PERIODS.map((p) => (
            <Chip key={p.id} label={p.label} selected={cfg.period === p.id} onPress={() => set({ period: p.id, offset: 0 })} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Période précédente" hitSlop={10} onPress={() => setRequested(shiftReport(cfg, -1))}>
            <Icon name="chevronLeft" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="heading" accessibilityLiveRegion="polite">
            {m.range.label}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Période suivante" accessibilityState={{ disabled: !m.canGoNext }} disabled={!m.canGoNext} hitSlop={10} onPress={() => setRequested(shiftReport(cfg, 1))} style={{ opacity: m.canGoNext ? 1 : 0.3 }}>
            <Icon name="chevronRight" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel="Filtrer par habitude">
          <Chip label="Toutes les habitudes" selected={cfg.habit === 'all'} onPress={() => set({ habit: 'all' })} />
          {m.habitOptions.map((h) => (
            <Chip key={h.id} label={`${h.emoji} ${h.name}`} selected={cfg.habit === h.id} onPress={() => set({ habit: h.id })} />
          ))}
        </ScrollView>
        {m.habit ? (
          <Link href={{ pathname: '/detail/[id]', params: { id: m.habit.id } }} asChild>
            <Button label="Voir la fiche" variant="outline" style={{ alignSelf: 'flex-start', minHeight: 40 }} />
          </Link>
        ) : null}
      </View>

      <View style={styles.statsGrid}>
        <StatTile value={String(m.stats.streak)} label={m.habit && (m.habit.type === 'weekly' || m.habit.type === 'times') ? 'Série (semaines)' : 'Série en cours'} />
        <StatTile value={`${m.stats.rate}%`} label="Taux de réussite" />
        <StatTile value={fmtNum(m.stats.validated)} label="Habitudes validées" />
        <StatTile value={String(m.stats.perfectDays)} label={m.habit?.type === 'times' ? 'Semaines réussies' : m.habit ? 'Jours réussis' : 'Journées parfaites'} />
      </View>

      <ReportCard title={m.habit ? `Réussite par ${cfg.period === 'year' ? 'mois' : 'jour'}` : 'Habitudes validées'} badge={cycle}>
        <BarChart buckets={m.buckets} year={cfg.period === 'year'} />
      </ReportCard>

      <ReportCard title="Évolution du taux de réussite" badge={cycle}>
        <LineChart points={m.rate} {...RATE_CHART} dotRadius={m.rate.length > 12 ? 2.5 : 4} label="Courbe du taux de réussite" />
      </ReportCard>

      <ReportCard title="Calendrier du mois" badge={m.calendar.label}>
        <CalendarStats cal={m.calendar} />
      </ReportCard>

      <ReportCard
        title="Calendrier d'humeur"
        badge={
          <Pressable accessibilityRole="button" onPress={() => router.push('/mood')}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.accentBg }}>
              <AppText variant="caption">+ Saisir l'humeur</AppText>
            </View>
          </Pressable>
        }
      >
        <MoodCalendarView />
      </ReportCard>

      <ReportCard title="Courbe d'humeur" badge={cycle}>
        <LineChart points={m.mood} {...MOOD_CHART} dotRadius={m.mood.length > 12 ? 2.5 : 3.5} emojis label="Courbe d'humeur" />
      </ReportCard>

      <ReportCard title="Bilan hebdomadaire" badge={card.label}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <AppText variant="title">{card.score}</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{card.verdict}</AppText>
            <AppText variant="caption" tone="text2">
              semaine dernière
            </AppText>
          </View>
          <Link href={{ pathname: '/review', params: { mon: card.mon } }} asChild>
            <Button label="Ouvrir le bilan" variant="outline" style={{ minHeight: 40, paddingHorizontal: 12 }} />
          </Link>
        </View>
      </ReportCard>

      <ReportCard title="Journal">
        <JournalView />
      </ReportCard>

      <ReportCard title="Insights">
        <InsightsCard />
      </ReportCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(128,128,128,0.25)' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 2, textAlign: 'center' },
});
