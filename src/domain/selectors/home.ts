import { LEVEL_NAMES } from '../constants/gamification';
import { DAY_SHORT } from '../constants/calendar';
import { addDays, fmtDate } from '../date/calendar';
import { appNow, midnight, today, type Ctx } from '../date/clock';
import { fmtNum } from '../format';
import { calcLevel } from '../gamification/levels';
import { isDayActive, isRequiredHabit, liveHabits } from '../habits/activity';
import { calcStreak } from '../habits/streaks';
import { streakLabel, streakWords, timesThisWeek } from '../habits/times';
import { badVal, dayProgress, habitProgress, isBadFail, isHabitDoneOn, isWeeklyDoneForWeek } from '../habits/values';
import { isPaused } from '../pause/pause';
import { getWeekMonday } from '../date/calendar';
import type { DateKey } from '../types/date';
import type { Habit } from '../types/habit';

// ─────────────── Bandeau du jour ───────────────

export interface HeroSegment {
  readonly color: string;
  readonly name: string;
  /** Avancement 0-1 de l'habitude. */
  readonly progress: number;
}

export interface HeroModel {
  readonly done: number;
  readonly required: number;
  readonly perfect: boolean;
  readonly paused: boolean;
  readonly level: number;
  readonly levelName: string;
  readonly segments: readonly HeroSegment[];
}

export function heroModel(ctx: Ctx): HeroModel {
  const day = midnight(ctx);
  const key = today(ctx);
  const due = ctx.db.habitDefs.filter((h) => isRequiredHabit(h) && isDayActive(ctx.db, h, day));
  const done = due.filter((h) => isHabitDoneOn(ctx.db, h, key, day));
  const level = calcLevel(ctx.db.xp);
  return {
    done: done.length,
    required: due.length,
    perfect: due.length > 0 && done.length === due.length,
    paused: isPaused(ctx.db, key),
    level,
    levelName: LEVEL_NAMES[level - 1] ?? 'Novice',
    segments: due.map((h) => ({ color: h.color, name: h.name, progress: dayProgress(ctx.db, h, key, day) })),
  };
}

// ─────────────── Onglet « Aujourd'hui » ───────────────

export type SubSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'flame' }
  | { readonly kind: 'dots'; readonly filled: number; readonly total: number };

export type TodayControl =
  | { readonly kind: 'toggle'; readonly done: boolean; readonly fail: boolean }
  | {
      readonly kind: 'stepper';
      readonly drink: boolean;
      readonly value: number;
      readonly goal: number;
      readonly max: number;
      readonly step: number;
      readonly unit: string;
      /** 0-100. */
      readonly pct: number;
      readonly atMax: boolean;
      readonly canRemove: boolean;
      readonly hint: string;
      /** Quantités proposées en boutons « + » (vide au maximum). */
      readonly addAmounts: readonly number[];
    }
  | {
      readonly kind: 'badLevels';
      /** « Non » puis les paliers. */
      readonly options: readonly string[];
      /** Index sélectionné, ou −1 (écart enregistré sans palier connu). */
      readonly selected: number;
    };

export interface TodayCard {
  readonly habit: Habit;
  readonly done: boolean;
  readonly sub: readonly SubSegment[];
  /** « accompli ! » : animation d'une habitude simple terminée. */
  readonly flourish: boolean;
  readonly control: TodayControl;
  /** Bouton à droite du nom (`inline`) ou sous la carte (`below`). */
  readonly placement: 'inline' | 'below';
  /** Mode zen : la carte terminée se replie. */
  readonly collapsed: boolean;
}

export type TodayEmpty = 'none' | 'paused' | 'empty';

export interface TodayModel {
  readonly cards: readonly TodayCard[];
  readonly empty: TodayEmpty;
}

const text = (t: string): SubSegment => ({ kind: 'text', text: t });

/** Texte brut d'un libellé (drapeau de flamme omis) : sert aux tests et à l'accessibilité. */
export const plainSub = (segments: readonly SubSegment[]): string =>
  segments
    .map((s) => (s.kind === 'text' ? s.text : s.kind === 'dots' ? '●'.repeat(s.filled) + '○'.repeat(s.total - s.filled) : ''))
    .join('');

export function todaySubLabel(ctx: Ctx, habit: Habit, key: DateKey): readonly SubSegment[] {
  if (habit.type === 'times') {
    const w = timesThisWeek(ctx, habit);
    const total = Math.max(1, w.required);
    const streak = calcStreak(ctx, habit).current;
    const out: SubSegment[] = [
      { kind: 'dots', filled: Math.min(w.done, total), total },
      text(` ${w.done}/${w.required} cette semaine`),
    ];
    if (streak > 0) out.push(text(' · '), { kind: 'flame' }, text(` ${streak} sem`));
    return out;
  }
  const streak = calcStreak(ctx, habit).current;
  if (habit.type === 'bad') {
    const failed = isBadFail(ctx.db, habit.id, key);
    const val = failed ? badVal(ctx.db, habit.id, key) : '';
    return [text(`${failed ? `Craqué${val ? ` · ${val}` : ''}` : 'Tenu bon'} · `), { kind: 'flame' }, text(` ${streak} j`)];
  }
  return streak > 0 ? [{ kind: 'flame' }, text(` ${streakWords(habit, streak)} de suite`)] : [text(habit.freq || 'Tous les jours')];
}

function todayControl(ctx: Ctx, habit: Habit, key: DateKey, day: Date): TodayControl {
  const { db } = ctx;
  if (habit.type === 'drink' || habit.type === 'counter') {
    const p = habitProgress(db, habit, key);
    const drink = habit.type === 'drink';
    const atMax = p.v >= p.max;
    return {
      kind: 'stepper',
      drink,
      value: p.v,
      goal: p.goal,
      max: p.max,
      step: p.step,
      unit: p.unit,
      pct: Math.min(100, Math.round((p.v / p.goal) * 100)),
      atMax,
      canRemove: p.v > 0,
      hint: p.v >= p.goal ? 'Objectif atteint' : `reste ${fmtNum(p.goal - p.v)} ${p.unit}`,
      addAmounts: atMax ? [] : drink ? [p.step, p.step * 2] : [p.step],
    };
  }
  if (habit.type === 'bad' && habit.levels) {
    const failed = isBadFail(db, habit.id, key);
    const val = failed ? badVal(db, habit.id, key) : '';
    const selected = !failed ? 0 : habit.levels.indexOf(val) + 1 || -1;
    return { kind: 'badLevels', options: ['Non', ...habit.levels], selected };
  }
  if (habit.type === 'bad') return { kind: 'toggle', done: isBadFail(db, habit.id, key), fail: true };
  const done =
    habit.type === 'weekly'
      ? isWeeklyDoneForWeek(db, habit.id, getWeekMonday(day))
      : db.habits[habit.id]?.logs[key] === 'done';
  return { kind: 'toggle', done, fail: false };
}

export function todayModel(ctx: Ctx): TodayModel {
  const { db } = ctx;
  const key = today(ctx);
  const day = midnight(ctx);
  const cards: TodayCard[] = [];
  for (const habit of liveHabits(db)) {
    if (!isDayActive(db, habit, day)) continue;
    const inline = habit.type === 'good' || habit.type === 'weekly' || habit.type === 'times' || (habit.type === 'bad' && !habit.levels);
    const done = habit.type !== 'bad' && isHabitDoneOn(db, habit, key, day);
    const flourish = done && inline && habit.type !== 'times';
    cards.push({
      habit,
      done,
      sub: flourish ? [text('accompli !')] : todaySubLabel(ctx, habit, key),
      flourish: flourish || (done && habit.type === 'times'),
      control: todayControl(ctx, habit, key, day),
      placement: inline ? 'inline' : 'below',
      collapsed: db.profile.zenMode && isHabitDoneOn(db, habit, key, day),
    });
  }
  const anyActive = db.habitDefs.some((h) => isDayActive(db, h, day));
  return { cards, empty: anyActive ? 'none' : isPaused(db, key) ? 'paused' : 'empty' };
}

// ─────────────── Onglet « Semaine » ───────────────

export interface WeekCell {
  readonly label: string;
  readonly date: DateKey;
  readonly isToday: boolean;
  readonly isSunday: boolean;
  readonly active: boolean;
  readonly done: boolean;
  readonly paused: boolean;
  /** Une case ne peut être touchée que si elle est active et pas dans le futur. */
  readonly tappable: boolean;
}

export interface WeekRow {
  readonly habit: Habit;
  readonly freqText: string;
  readonly streak: string;
  readonly cells: readonly WeekCell[];
}

export function timesWeekText(ctx: Ctx, habit: Habit): string {
  if (habit.type !== 'times') return '';
  const w = timesThisWeek(ctx, habit);
  return `${w.done}/${w.required} cette semaine`;
}

const freqOf = (ctx: Ctx, h: Habit): string =>
  h.type === 'times' ? `${h.freq} · ${timesWeekText(ctx, h)}` : h.freq || 'Tous les jours';

export function weekModel(ctx: Ctx): readonly WeekRow[] {
  const { db } = ctx;
  const now = midnight(ctx);
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = addDays(now, -dow);
  return liveHabits(db).map((habit) => ({
    habit,
    freqText: freqOf(ctx, habit),
    streak: streakLabel(habit, calcStreak(ctx, habit).current),
    cells: DAY_SHORT.map((label, i): WeekCell => {
      const d = addDays(monday, i);
      const date = fmtDate(d);
      const active = isDayActive(db, habit, d);
      const future = d > now;
      return {
        label,
        date,
        isToday: i === dow,
        isSunday: i === 6,
        active,
        done: active && isHabitDoneOn(db, habit, date, d),
        paused: isPaused(db, date),
        tappable: !future && active,
      };
    }),
  }));
}

// ─────────────── Onglet « Global » ───────────────

export const OVERALL_WEEKS = 16;

export type OverallState = 'inactive' | 'failed' | 'done' | 'missed' | 'none';

export interface OverallCell {
  readonly date: DateKey;
  readonly state: OverallState;
  readonly paused: boolean;
  /** Infobulle / libellé d'accessibilité. */
  readonly title: string;
}

export interface OverallRow {
  readonly habit: Habit;
  readonly freqText: string;
  readonly streak: string;
  /** `grid[jour][semaine]` : 7 lignes (lundi → dimanche) × 16 semaines. */
  readonly grid: readonly (readonly OverallCell[])[];
}

export function overallModel(ctx: Ctx): readonly OverallRow[] {
  const { db } = ctx;
  const now = midnight(ctx);
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const start = addDays(addDays(now, -dow), -((OVERALL_WEEKS - 1) * 7));
  return liveHabits(db).map((habit) => ({
    habit,
    freqText: freqOf(ctx, habit),
    streak: streakLabel(habit, calcStreak(ctx, habit).current),
    grid: DAY_SHORT.map((_, p) =>
      Array.from({ length: OVERALL_WEEKS }, (_w, o): OverallCell => {
        const d = addDays(start, o * 7 + p);
        const date = fmtDate(d);
        const paused = isPaused(db, date);
        if (!isDayActive(db, habit, d) || d > now) {
          return { date, state: 'inactive', paused, title: paused ? `${date} · pause` : date };
        }
        if (habit.type === 'bad' && isBadFail(db, habit.id, date)) {
          const v = badVal(db, habit.id, date);
          return { date, state: 'failed', paused, title: `${date} · craqué${v ? ` (${v})` : ''}` };
        }
        if (isHabitDoneOn(db, habit, date, d)) return { date, state: 'done', paused, title: date };
        if (date >= db.createdAt && habit.type !== 'times') return { date, state: 'missed', paused, title: date };
        return { date, state: 'none', paused, title: date };
      }),
    ),
  }));
}

// ─────────────── Liste « Mes habitudes » ───────────────

export interface MyHabitRow {
  readonly habit: Habit;
  readonly meta: string;
  /** 0-100 pour les compteurs et l'eau, sinon `null`. */
  readonly progressPct: number | null;
  readonly streak: string;
  readonly done: boolean;
  /** La pastille de droite est un vrai bouton (sinon, simple indicateur). */
  readonly canToggle: boolean;
}

export function myHabitsModel(ctx: Ctx): readonly MyHabitRow[] {
  const { db } = ctx;
  const key = today(ctx);
  const day = midnight(ctx);
  return liveHabits(db).map((habit): MyHabitRow => {
    const numeric = habit.type === 'drink' || habit.type === 'counter';
    let meta = habit.freq || 'Tous les jours';
    if (habit.type === 'times') meta = timesWeekText(ctx, habit);
    if (numeric) {
      const p = habitProgress(db, habit, key);
      meta = `${fmtNum(p.v)} / ${fmtNum(p.goal)} ${p.unit}`;
    }
    if (habit.type === 'bad') {
      const failed = isBadFail(db, habit.id, key);
      const v = badVal(db, habit.id, key);
      meta = failed ? `Craqué${v ? ` · ${v}` : ''}` : 'Tenu bon';
    }
    return {
      habit,
      meta,
      progressPct: numeric ? Math.min(100, Math.round(dayProgress(db, habit, key, day) * 100)) : null,
      streak: streakLabel(habit, calcStreak(ctx, habit).current),
      done: isHabitDoneOn(db, habit, key, day),
      canToggle: !numeric && !(habit.type === 'bad' && !!habit.levels),
    };
  });
}

export interface ArchivedRow {
  readonly habit: Habit;
  readonly archivedOn: DateKey | null;
  readonly bestStreak: string;
}

export function archivedModel(ctx: Ctx): readonly ArchivedRow[] {
  return ctx.db.habitDefs
    .filter((h) => h.archived)
    .map((habit) => ({
      habit,
      archivedOn: habit.archivedOn ?? null,
      bestStreak: streakLabel(habit, calcStreak(ctx, habit).longest),
    }));
}

/** Date affichée en tête de l'accueil, ex. « mercredi 28 octobre ». */
export const heroDateLabel = (ctx: Ctx): string =>
  appNow(ctx).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
