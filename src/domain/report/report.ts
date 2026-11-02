import { DAY_SHORT, MONTH_NAMES, MONTH_SHORT } from '../constants/calendar';
import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { midnight, today, type Ctx } from '../date/clock';
import { isDayActive, liveHabits } from '../habits/activity';
import { calcStreak } from '../habits/streaks';
import { timesWeekInfo, weeklyUnit } from '../habits/times';
import { getHabitDayValue, isHabitDoneOn } from '../habits/values';
import { isPaused } from '../pause/pause';
import type { DateKey } from '../types/date';
import type { Habit, TimesHabit } from '../types/habit';

export type ReportPeriod = 'week' | 'month' | 'year';
export const REPORT_PERIODS: readonly { readonly id: ReportPeriod; readonly label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

export interface ReportConfig {
  readonly period: ReportPeriod;
  /** 0 = période en cours, −1 = la précédente… (jamais positif). */
  readonly offset: number;
  /** `'all'` ou l'identifiant d'une habitude. */
  readonly habit: string;
}

export const defaultReportConfig: ReportConfig = { period: 'week', offset: 0, habit: 'all' };

export const nextPeriod = (p: ReportPeriod): ReportPeriod =>
  REPORT_PERIODS[(REPORT_PERIODS.findIndex((x) => x.id === p) + 1) % REPORT_PERIODS.length]?.id ?? 'week';

/** Décale la période ; refuse d'aller dans le futur. */
export const shiftReport = (cfg: ReportConfig, delta: number): ReportConfig =>
  cfg.offset + delta > 0 ? cfg : { ...cfg, offset: cfg.offset + delta };

const fmtShort = (d: Date): string => `${d.getDate()} ${(MONTH_SHORT[d.getMonth()] ?? '').toLowerCase()}`;

export interface ReportRange {
  readonly start: Date;
  readonly end: Date;
  /** Aujourd'hui (minuit). */
  readonly t: Date;
  readonly label: string;
}

export function reportRange(ctx: Ctx, cfg: ReportConfig): ReportRange {
  const e = midnight(ctx);
  if (cfg.period === 'week') {
    const dow = e.getDay() === 0 ? 6 : e.getDay() - 1;
    const start = addDays(e, -dow + cfg.offset * 7);
    const end = addDays(start, 6);
    return { start, end, t: e, label: `${fmtShort(start)} – ${fmtShort(end)}` };
  }
  if (cfg.period === 'month') {
    const start = new Date(e.getFullYear(), e.getMonth() + cfg.offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end, t: e, label: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}` };
  }
  const year = e.getFullYear() + cfg.offset;
  return { start: new Date(year, 0, 1), end: new Date(year, 11, 31), t: e, label: String(year) };
}

/** Habitudes concernées (les archivées comptent : leur historique reste dans les statistiques). */
const reportHabits = (ctx: Ctx, cfg: ReportConfig): readonly Habit[] =>
  cfg.habit === 'all' ? ctx.db.habitDefs : ctx.db.habitDefs.filter((h) => h.id === cfg.habit);

export interface DayStat {
  readonly k: DateKey;
  readonly req: number;
  /** Somme des avancements (1 par habitude faite ; fractions pour une seule habitude). */
  readonly done: number;
  /** Habitudes réussies. */
  readonly cnt: number;
  readonly rate: number;
}

export function dayStat(ctx: Ctx, cfg: ReportConfig, day: Date, includeOptional = false): DayStat | null {
  const { db } = ctx;
  const key = fmtDate(day);
  if (day > midnight(ctx) || key < db.createdAt) return null;
  let req = 0;
  let done = 0;
  let cnt = 0;
  for (const h of reportHabits(ctx, cfg)) {
    if ((cfg.habit === 'all' && (h.type === 'times' || (h.optional && !includeOptional))) || !isDayActive(db, h, day)) continue;
    const v = getHabitDayValue(db, h, key, day);
    req++;
    if (v >= 1) cnt++;
    done += cfg.habit === 'all' ? (v >= 1 ? 1 : 0) : Math.min(1, v);
  }
  return req > 0 ? { k: key, req, done, cnt, rate: done / req } : null;
}

/** Semaines réussies / semaines évaluées d'une habitude « X fois par semaine » entre deux dates. */
export function timesRangeStats(ctx: Ctx, habit: TimesHabit, start: Date, end: Date): { ok: number; tot: number } {
  let monday = parseDate(getWeekMonday(start));
  if (monday < start) monday = addDays(monday, 7);
  let ok = 0;
  let tot = 0;
  for (; monday <= end; monday = addDays(monday, 7)) {
    const state = timesWeekInfo(ctx, habit, fmtDate(monday)).state;
    if (state === 'success') {
      ok++;
      tot++;
    } else if (state === 'failed') tot++;
  }
  return { ok, tot };
}

export interface ReportStats {
  readonly streak: number;
  readonly rate: number;
  readonly validated: number;
  readonly perfectDays: number;
}

export function reportStats(ctx: Ctx, cfg: ReportConfig): ReportStats {
  const { db } = ctx;
  const { start, end, t } = reportRange(ctx, cfg);
  let req = 0;
  let done = 0;
  let validated = 0;
  let perfect = 0;
  for (let day = new Date(start); day <= end && day <= t; day = addDays(day, 1)) {
    const stat = dayStat(ctx, cfg, day);
    const key = fmtDate(day);
    if (stat) {
      req += stat.req;
      done += stat.done;
      if (stat.rate >= 1) perfect++;
    }
    for (const h of reportHabits(ctx, cfg)) {
      if (h.type === 'bad' || !isDayActive(db, h, day) || key < db.createdAt) continue;
      if (h.type === 'weekly') {
        if (db.habits[h.id]?.logs[key] === 'done') validated++;
      } else if (isHabitDoneOn(db, h, key, day)) validated++;
    }
  }
  const single = cfg.habit === 'all' ? null : db.habitDefs.find((h) => h.id === cfg.habit) ?? null;
  const streak = single
    ? calcStreak(ctx, single).current
    : liveHabits(db).filter((h) => !weeklyUnit(h)).reduce((m, h) => Math.max(m, calcStreak(ctx, h).current), 0);
  const perfectClaimed =
    cfg.habit === 'all' ? db.perfectDaysClaimed.filter((k) => k >= fmtDate(start) && k <= fmtDate(end)).length : perfect;
  if (single && single.type === 'times') {
    const s = timesRangeStats(ctx, single, start, end);
    return { streak, rate: s.tot > 0 ? Math.round((s.ok / s.tot) * 100) : 0, validated, perfectDays: s.ok };
  }
  return { streak, rate: req > 0 ? Math.round((done / req) * 100) : 0, validated, perfectDays: perfectClaimed };
}

export interface Bucket {
  readonly label: string;
  readonly barLabel: string;
  readonly showLabel: boolean;
  /** 0-1, ou `null` sans donnée. */
  readonly rate: number | null;
  readonly cnt: number;
  readonly req: number;
  readonly isToday: boolean;
  readonly future: boolean;
}

export function reportBuckets(ctx: Ctx, cfg: ReportConfig): readonly Bucket[] {
  const { start, end, t } = reportRange(ctx, cfg);
  if (cfg.period === 'year') {
    return Array.from({ length: 12 }, (_, m): Bucket => {
      let req = 0;
      let done = 0;
      let cnt = 0;
      const days = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const s = dayStat(ctx, cfg, new Date(start.getFullYear(), m, d), true);
        if (s) {
          req += s.req;
          done += s.done;
          cnt += s.cnt;
        }
      }
      const name = MONTH_SHORT[m] ?? '';
      return {
        label: name.slice(0, 3),
        barLabel: name[0] ?? '',
        showLabel: true,
        rate: req > 0 ? done / req : null,
        cnt,
        req,
        isToday: start.getFullYear() === t.getFullYear() && m === t.getMonth(),
        future: false,
      };
    });
  }
  const out: Bucket[] = [];
  let i = 0;
  for (let day = new Date(start); day <= end; day = addDays(day, 1), i++) {
    const s = dayStat(ctx, cfg, day, true);
    const label = cfg.period === 'week' ? (DAY_SHORT[i] ?? '') : String(day.getDate());
    out.push({
      label,
      barLabel: label,
      showLabel: cfg.period === 'week' || day.getDate() === 1 || day.getDate() % 5 === 0,
      rate: s ? s.rate : null,
      cnt: s ? s.cnt : 0,
      req: s ? s.req : 0,
      isToday: fmtDate(day) === fmtDate(t),
      future: day > t,
    });
  }
  return out;
}

export interface SeriesPoint {
  readonly label: string;
  readonly showLabel: boolean;
  readonly v: number | null;
  /** Affiche l'emoji d'humeur au-dessus du point. */
  readonly emoji?: boolean;
}

/** Taux de réussite en pourcentage par barre, pour la courbe. */
export const rateSeries = (buckets: readonly Bucket[]): readonly SeriesPoint[] =>
  buckets.map((b) => ({ label: b.label, showLabel: b.showLabel, v: b.rate == null ? null : Math.round(b.rate * 100) }));

export function moodPoints(ctx: Ctx, cfg: ReportConfig): readonly SeriesPoint[] {
  const { start, end, t } = reportRange(ctx, cfg);
  const { db } = ctx;
  if (cfg.period === 'year') {
    return Array.from({ length: 12 }, (_, m): SeriesPoint => {
      const values: number[] = [];
      const days = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const v = db.moods[fmtDate(new Date(start.getFullYear(), m, d))];
        if (v) values.push(v);
      }
      return {
        label: (MONTH_SHORT[m] ?? '').slice(0, 3),
        showLabel: true,
        v: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
        emoji: false,
      };
    });
  }
  const out: SeriesPoint[] = [];
  let i = 0;
  for (let day = new Date(start); day <= end; day = addDays(day, 1), i++) {
    const v = db.moods[fmtDate(day)];
    out.push({
      label: cfg.period === 'week' ? (DAY_SHORT[i]?.[0] ?? '') : String(day.getDate()),
      showLabel: cfg.period === 'week' || day.getDate() === 1 || day.getDate() % 5 === 0,
      v: v && day <= t ? v : null,
      emoji: cfg.period === 'week',
    });
  }
  return out;
}

export type CalendarStatKind = 'future' | 'paused' | 'plain' | 'perfect' | 'good' | 'missed' | 'none';

export interface CalendarStatCell {
  readonly day: number;
  readonly kind: CalendarStatKind;
  readonly title: string;
}

export interface CalendarStats {
  readonly label: string;
  readonly leading: number;
  readonly cells: readonly CalendarStatCell[];
}

/** Calendrier du mois de la fin de période (ou d'aujourd'hui si la période n'est pas terminée). */
export function calendarStats(ctx: Ctx, cfg: ReportConfig): CalendarStats {
  const { end, t } = reportRange(ctx, cfg);
  const ref = end > t ? t : end;
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const todayKey = today(ctx);
  const cells: CalendarStatCell[] = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const key = fmtDate(date);
    if (key > todayKey) cells.push({ day: d, kind: 'future', title: '' });
    else if (isPaused(ctx.db, key)) cells.push({ day: d, kind: 'paused', title: 'Pause' });
    else if (key < ctx.db.createdAt) cells.push({ day: d, kind: 'plain', title: '' });
    else {
      const s = dayStat(ctx, cfg, date);
      if (!s) cells.push({ day: d, kind: 'none', title: '' });
      else cells.push({ day: d, kind: s.rate >= 1 ? 'perfect' : s.rate >= 0.7 ? 'good' : 'missed', title: `${s.cnt}/${s.req}` });
    }
  }
  return { label: `${MONTH_NAMES[m]} ${y}`, leading: first.getDay() === 0 ? 6 : first.getDay() - 1, cells };
}

export interface Run {
  readonly index: number;
  readonly v: number;
}

/** Découpe une série en tronçons continus (les valeurs absentes interrompent la courbe). */
export function chartRuns(points: readonly SeriesPoint[]): readonly (readonly Run[])[] {
  const runs: Run[][] = [];
  let cur: Run[] = [];
  points.forEach((p, index) => {
    if (p.v == null) {
      if (cur.length) runs.push(cur);
      cur = [];
    } else cur.push({ index, v: p.v });
  });
  if (cur.length) runs.push(cur);
  return runs;
}

export interface ReportModel {
  readonly cfg: ReportConfig;
  readonly range: ReportRange;
  readonly habit: Habit | null;
  readonly stats: ReportStats;
  readonly buckets: readonly Bucket[];
  readonly rate: readonly SeriesPoint[];
  readonly mood: readonly SeriesPoint[];
  readonly calendar: CalendarStats;
  readonly periodLabel: string;
  readonly canGoNext: boolean;
  /** Habitudes proposées dans le filtre. */
  readonly habitOptions: readonly Habit[];
}

/** Si l'habitude filtrée n'existe plus, on revient sur « toutes les habitudes ». */
export const sanitizeReportConfig = (ctx: Ctx, cfg: ReportConfig): ReportConfig =>
  cfg.habit !== 'all' && !ctx.db.habitDefs.some((h) => h.id === cfg.habit) ? { ...cfg, habit: 'all' } : cfg;

export function reportModel(ctx: Ctx, requested: ReportConfig): ReportModel {
  const cfg = sanitizeReportConfig(ctx, requested);
  const buckets = reportBuckets(ctx, cfg);
  return {
    cfg,
    range: reportRange(ctx, cfg),
    habit: cfg.habit === 'all' ? null : ctx.db.habitDefs.find((h) => h.id === cfg.habit) ?? null,
    stats: reportStats(ctx, cfg),
    buckets,
    rate: rateSeries(buckets),
    mood: moodPoints(ctx, cfg),
    calendar: calendarStats(ctx, cfg),
    periodLabel: REPORT_PERIODS.find((p) => p.id === cfg.period)?.label ?? '',
    canGoNext: cfg.offset < 0,
    habitOptions: liveHabits(ctx.db),
  };
}

