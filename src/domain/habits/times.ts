import { TIMES_MAX } from '../constants/habits';
import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { appNow, today, type Ctx } from '../date/clock';
import type { DateKey } from '../types/date';
import type { Habit, TimesHabit } from '../types/habit';
import { isDayActive } from './activity';

export type TimesWeekState = 'neutral' | 'success' | 'open' | 'failed';

export interface TimesWeekInfo {
  /** Jours actifs de la semaine. */
  readonly active: number;
  readonly done: number;
  /** Jours restants (aujourd'hui inclus) où l'on peut encore cocher. */
  readonly remaining: number;
  readonly target: number;
  /** Objectif ramené au nombre de jours actifs (semaine amputée par une pause, etc.). */
  readonly required: number;
  readonly state: TimesWeekState;
}

export const weeklyUnit = (h: Habit): boolean => h.type === 'weekly' || h.type === 'times';

export const streakLabel = (h: Habit, n: number): string => `${n} ${weeklyUnit(h) ? 'sem' : 'j'}`;

export const streakWords = (h: Habit, n: number): string =>
  weeklyUnit(h) ? `${n} semaine${n > 1 ? 's' : ''}` : `${n} jour${n > 1 ? 's' : ''}`;

/** Bilan d'une semaine (lundi → dimanche) pour une habitude « X fois par semaine ». */
export function timesWeekInfo(ctx: Ctx, habit: TimesHabit, monday: DateKey): TimesWeekInfo {
  const { db } = ctx;
  const logs = db.habits[habit.id]?.logs ?? {};
  const todayKey = today(ctx);
  const start = parseDate(monday);
  let active = 0;
  let done = 0;
  let remaining = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const key = fmtDate(day);
    if (key < db.createdAt || !isDayActive(db, habit, day, key)) continue;
    active++;
    if (logs[key] === 'done') done++;
    else if (key >= todayKey) remaining++;
  }
  const target = Math.max(1, Math.min(TIMES_MAX, Math.floor(habit.target) || 1));
  const required = Math.min(target, active);
  let state: TimesWeekState;
  if (active === 0) state = 'neutral';
  else if (done >= required) state = 'success';
  else if (done + remaining >= required) state = 'open';
  else state = 'failed';
  return { active, done, remaining, target, required, state };
}

export const timesThisWeek = (ctx: Ctx, habit: TimesHabit): TimesWeekInfo =>
  timesWeekInfo(ctx, habit, getWeekMonday(appNow(ctx)));

/** Série en semaines réussies (la semaine en cours ne casse jamais la série tant qu'elle est ouverte). */
export function calcTimesStreak(ctx: Ctx, habit: TimesHabit): { current: number; longest: number } {
  const thisMonday = getWeekMonday(appNow(ctx));
  const floor = [ctx.db.createdAt, habit.since ?? ''].sort().pop() ?? ctx.db.createdAt;
  const weekEnd = (monday: DateKey): DateKey => fmtDate(addDays(parseDate(monday), 6));
  const mondayAgo = (n: number): DateKey => fmtDate(addDays(parseDate(thisMonday), -n * 7));

  let current = 0;
  const now = timesWeekInfo(ctx, habit, thisMonday);
  if (now.state !== 'failed') {
    if (now.state === 'success') current++;
    for (let n = 1; n < 156 && !(weekEnd(mondayAgo(n)) < floor); n++) {
      const state = timesWeekInfo(ctx, habit, mondayAgo(n)).state;
      if (state === 'success') current++;
      else if (state === 'failed') break;
    }
  }

  let best = 0;
  let run = 0;
  for (let n = 155; n >= 0; n--) {
    if (weekEnd(mondayAgo(n)) < floor) continue;
    const state = timesWeekInfo(ctx, habit, mondayAgo(n)).state;
    if (state === 'success') {
      run++;
      best = Math.max(best, run);
    } else if (state === 'failed') {
      run = 0;
    }
  }
  return { current, longest: Math.max(best, current) };
}
