import { DAY_FULL, DAY_SHORT, MONTH_SHORT } from '../constants/calendar';
import { MOOD_EMOJIS } from '../constants/gamification';
import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { appNow, midnight, today, type Ctx } from '../date/clock';
import { fmtNum } from '../format';
import { isDayActive } from '../habits/activity';
import { calcStreak } from '../habits/streaks';
import { streakLabel, timesWeekInfo } from '../habits/times';
import { badVal, getHabitDayValue, isBadFail, isWeeklyDoneForWeek } from '../habits/values';
import { isPaused } from '../pause/pause';
import type { DateKey } from '../types/date';
import type { Habit } from '../types/habit';
import { compareMood, f1, insightRows, type RichText } from './insights';
import { timesRangeStats, type SeriesPoint } from './report';

export const DETAIL_TREND_WEEKS = 26;
export const DETAIL_DOW_DAYS = 84;

export type DetailCellKind = 'future' | 'none' | 'paused' | 'off' | 'fail' | 'done' | 'rest' | 'part' | 'miss';

export interface DetailCell {
  readonly c: DetailCellKind;
  readonly t: string;
  /** Avancement partiel 0-1 (cases « partiel »). */
  readonly a?: number;
}

export function detailCell(ctx: Ctx, habit: Habit, day: Date): DetailCell {
  const { db } = ctx;
  const key = fmtDate(day);
  const logs = db.habits[habit.id]?.logs ?? {};
  if (key > today(ctx)) return { c: 'future', t: '' };
  if (key < db.createdAt) return { c: 'none', t: '' };
  if (isPaused(db, key)) return { c: 'paused', t: 'pause' };
  if (!isDayActive(db, habit, day)) return { c: 'off', t: 'inactif' };
  if (habit.type === 'bad') {
    if (isBadFail(db, habit.id, key)) {
      const v = badVal(db, habit.id, key);
      return { c: 'fail', t: `craqué${v ? ` (${v})` : ''}` };
    }
    return { c: 'done', t: 'tenu bon' };
  }
  if (habit.type === 'weekly' || habit.type === 'times') return logs[key] === 'done' ? { c: 'done', t: 'fait' } : { c: 'rest', t: '–' };
  const v = getHabitDayValue(db, habit, key, day);
  if (v >= 1) return { c: 'done', t: 'objectif atteint' };
  if (v > 0) return { c: 'part', t: `${Math.round(v * 100)} %`, a: v };
  return { c: 'miss', t: 'manqué' };
}

export interface DetailGrid {
  readonly year: number;
  /** `weeks[semaine][jour]` : `null` = case hors de l'année. */
  readonly weeks: readonly (readonly ({ readonly date: DateKey; readonly cell: DetailCell } | null)[])[];
  /** Colonnes où commence un mois. */
  readonly months: readonly { readonly week: number; readonly label: string }[];
  readonly doneCount: number;
}

export function detailGrid(ctx: Ctx, habit: Habit, year: number): DetailGrid {
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);
  const origin = parseDate(getWeekMonday(first));
  const count = Math.round((parseDate(getWeekMonday(last)).getTime() - origin.getTime()) / 6048e5) + 1;
  const weeks: ({ date: DateKey; cell: DetailCell } | null)[][] = [];
  const months: { week: number; label: string }[] = [];
  let doneCount = 0;
  for (let w = 0; w < count; w++) {
    const col: ({ date: DateKey; cell: DetailCell } | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(origin, w * 7 + i);
      if (day.getFullYear() !== year) {
        col.push(null);
        continue;
      }
      const cell = detailCell(ctx, habit, day);
      if (cell.c === 'done') doneCount++;
      col.push({ date: fmtDate(day), cell });
      if (day.getDate() === 1) months.push({ week: w, label: (MONTH_SHORT[day.getMonth()] ?? '').slice(0, 3) });
    }
    weeks.push(col);
  }
  return { year, weeks, months, doneCount };
}

export interface DetailTotals {
  readonly cur: number;
  readonly best: number;
  readonly rate: number | null;
  readonly rateLabel: string;
  readonly t4: readonly [string, string];
}

export function detailTotals(ctx: Ctx, habit: Habit): DetailTotals {
  const { db } = ctx;
  const logs = db.habits[habit.id]?.logs ?? {};
  const streak = calcStreak(ctx, habit);
  const doneCount = Object.keys(logs).filter((k) => logs[k as DateKey] === 'done').length;
  const t0 = appNow(ctx);
  t0.setHours(0, 0, 0, 0);

  let rate: number | null = null;
  let rateLabel = 'Taux sur 30 jours';
  if (habit.type === 'times') {
    const s = timesRangeStats(ctx, habit, addDays(t0, -55), t0);
    rate = s.tot ? Math.round((s.ok / s.tot) * 100) : null;
    rateLabel = 'Semaines réussies (8 dern.)';
  } else if (habit.type === 'weekly') {
    let ok = 0;
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const mon = fmtDate(addDays(parseDate(getWeekMonday(t0)), -i * 7));
      if (mon < db.createdAt && i > 0) break;
      total++;
      if (isWeeklyDoneForWeek(db, habit.id, mon)) ok++;
    }
    rate = total ? Math.round((ok / total) * 100) : null;
    rateLabel = 'Semaines faites (8 dern.)';
  } else {
    let total = 0;
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      const day = addDays(t0, -i);
      const key = fmtDate(day);
      if (key < db.createdAt || !isDayActive(db, habit, day)) continue;
      total++;
      sum += Math.min(1, getHabitDayValue(db, habit, key, day));
    }
    rate = total ? Math.round((sum / total) * 100) : null;
  }

  let t4: readonly [string, string];
  if (habit.type === 'counter' || habit.type === 'drink') {
    const total = Object.values(logs).reduce<number>((a, v) => a + (typeof v === 'number' ? v : 0), 0);
    t4 = [`${fmtNum(Math.round(total * 10) / 10)} ${habit.type === 'drink' ? 'ml' : habit.unit || ''}`.trim(), 'Total cumulé'];
  } else if (habit.type === 'bad') {
    t4 = [String(Object.keys(logs).filter((k) => logs[k as DateKey] === 'fail').length), 'Craquages'];
  } else if (habit.type === 'times' || habit.type === 'weekly') {
    t4 = [String(doneCount), habit.type === 'times' ? 'Séances au total' : 'Fois au total'];
  } else t4 = [String(doneCount), 'Jours réussis'];
  return { cur: streak.current, best: streak.longest, rate, rateLabel, t4 };
}

export interface WeekdayBar {
  readonly label: string;
  readonly rate: number | null;
  readonly n: number;
}

export function detailWeekdays(ctx: Ctx, habit: Habit): readonly WeekdayBar[] {
  const { db } = ctx;
  const base = midnight(ctx);
  const acc = Array.from({ length: 7 }, () => ({ req: 0, done: 0 }));
  for (let i = 0; i < DETAIL_DOW_DAYS; i++) {
    const day = addDays(base, -i);
    const key = fmtDate(day);
    if (key < db.createdAt || !isDayActive(db, habit, day)) continue;
    const slot = acc[(day.getDay() + 6) % 7];
    if (!slot) continue;
    slot.req++;
    const ok =
      habit.type === 'bad'
        ? !isBadFail(db, habit.id, key)
        : habit.type === 'weekly' || habit.type === 'times'
          ? db.habits[habit.id]?.logs[key] === 'done'
          : getHabitDayValue(db, habit, key, day) >= 1;
    if (ok) slot.done++;
  }
  return acc.map((s, i) => ({ label: DAY_SHORT[i] ?? '', rate: s.req >= 3 ? Math.round((s.done / s.req) * 100) : null, n: s.req }));
}

export function detailTrend(ctx: Ctx, habit: Habit): readonly SeriesPoint[] {
  const { db } = ctx;
  const base = midnight(ctx);
  const monday = parseDate(getWeekMonday(base));
  const out: SeriesPoint[] = [];
  for (let n = DETAIL_TREND_WEEKS - 1; n >= 0; n--) {
    const start = addDays(monday, -n * 7);
    const key = fmtDate(start);
    let v: number | null = null;
    if (fmtDate(addDays(start, 6)) >= db.createdAt) {
      if (habit.type === 'times') {
        const w = timesWeekInfo(ctx, habit, key);
        v = w.required > 0 ? Math.round(Math.min(1, w.done / w.required) * 100) : null;
      } else if (habit.type === 'weekly') v = isWeeklyDoneForWeek(db, habit.id, key) ? 100 : 0;
      else {
        let total = 0;
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const day = addDays(start, i);
          const k = fmtDate(day);
          if (k > today(ctx) || k < db.createdAt || !isDayActive(db, habit, day)) continue;
          total++;
          sum += habit.type === 'bad' ? (isBadFail(db, habit.id, k) ? 0 : 1) : Math.min(1, getHabitDayValue(db, habit, k, day));
        }
        v = total ? Math.round((sum / total) * 100) : null;
      }
    }
    out.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, showLabel: n % 5 === 0, v });
  }
  return out;
}

export interface DetailModel {
  readonly habit: Habit;
  readonly freqText: string;
  readonly tiles: readonly { readonly value: string; readonly label: string }[];
  readonly moodNote: { readonly emoji: string; readonly parts: readonly RichText[] } | null;
  readonly levels: readonly { readonly level: string; readonly count: number }[];
  readonly grid: DetailGrid;
  readonly canPrevYear: boolean;
  readonly canNextYear: boolean;
  readonly weekdays: readonly WeekdayBar[];
  readonly weekdayText: readonly RichText[];
  readonly trend: readonly SeriesPoint[];
}

const rt = (text: string, bold = false): RichText => ({ text, bold });

export const clampDetailYear = (ctx: Ctx, year: number): number =>
  Math.max(parseDate(ctx.db.createdAt).getFullYear(), Math.min(appNow(ctx).getFullYear(), year));

export function detailModel(ctx: Ctx, habitId: string, requestedYear?: number): DetailModel | null {
  const { db } = ctx;
  const habit = db.habitDefs.find((h) => h.id === habitId);
  if (!habit) return null;
  const year = clampDetailYear(ctx, requestedYear ?? appNow(ctx).getFullYear());
  const totals = detailTotals(ctx, habit);
  const weekdays = detailWeekdays(ctx, habit);
  const known = weekdays.filter((w) => w.rate != null);

  let weekdayText: readonly RichText[] = [rt('Pas encore assez de données (3 jours par jour de la semaine).')];
  if (known.length >= 4) {
    const hi = known.reduce((a, w) => ((w.rate ?? 0) > (a.rate ?? 0) ? w : a));
    const lo = known.reduce((a, w) => ((w.rate ?? 0) < (a.rate ?? 0) ? w : a));
    const dn = (w: WeekdayBar): string => (DAY_FULL[(DAY_SHORT.indexOf(w.label as (typeof DAY_SHORT)[number]) + 1) % 7] ?? '').toLowerCase();
    weekdayText =
      habit.type === 'bad'
        ? [rt('Ton jour le plus solide : '), rt(dn(hi), true), rt(` (${hi.rate} %) · le plus risqué : `), rt(dn(lo), true), rt(` (${lo.rate} %).`)]
        : hi.rate === lo.rate
          ? [rt('Régulier toute la semaine.')]
          : [rt('Ton jour fort : '), rt(dn(hi), true), rt(` (${hi.rate} %) · le plus faible : `), rt(dn(lo), true), rt(` (${lo.rate} %).`)];
  }

  let moodNote: DetailModel['moodNote'] = null;
  if (habit.type !== 'weekly') {
    const c = compareMood(insightRows(ctx, 120), (r) => r.done[habit.id]);
    if (c && Math.abs(c.diff) >= 0.2) {
      moodNote = {
        emoji: MOOD_EMOJIS[Math.round(c.a)] || '😐',
        parts: [rt('Humeur moyenne les jours où c’est fait : '), rt(f1(c.a), true), rt(` (contre ${f1(c.b)} sinon), sur ${c.n} jours.`)],
      };
    }
  }

  const levels: { level: string; count: number }[] = [];
  if (habit.type === 'bad' && habit.levels) {
    const counts: Record<string, number> = {};
    for (const v of Object.values(db.habits[habit.id]?.vals ?? {})) counts[v] = (counts[v] ?? 0) + 1;
    for (const level of habit.levels) if (counts[level]) levels.push({ level, count: counts[level] ?? 0 });
  }

  return {
    habit,
    freqText: `${habit.freq || 'Tous les jours'}${habit.archived ? ' · archivée' : ''}`,
    tiles: [
      { value: streakLabel(habit, totals.cur), label: 'Série en cours' },
      { value: streakLabel(habit, totals.best), label: 'Meilleure série' },
      { value: totals.rate == null ? '–' : `${totals.rate} %`, label: totals.rateLabel },
      { value: totals.t4[0], label: totals.t4[1] },
    ],
    moodNote,
    levels,
    grid: detailGrid(ctx, habit, year),
    canPrevYear: year > parseDate(db.createdAt).getFullYear(),
    canNextYear: year < appNow(ctx).getFullYear(),
    weekdays,
    weekdayText,
    trend: detailTrend(ctx, habit),
  };
}

