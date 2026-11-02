import { addDays, fmtDate, parseDate } from '../date/calendar';
import { midnight, today, type Ctx } from '../date/clock';
import { isDayActive } from '../habits/activity';
import { isBadFail, isHabitDoneOn } from '../habits/values';
import type { DateKey } from '../types/date';
import type { Challenge } from '../types/db';
import type { Habit } from '../types/habit';

export type ChallengeState = 'active' | 'won' | 'failed' | 'void';

export interface ChallengeEval {
  /** Jours réussis. */
  readonly success: number;
  /** Jours encore à jouer (aujourd'hui et le futur). */
  readonly pending: number;
  readonly required: number;
  readonly activeTotal: number;
  readonly dayNo: number;
  readonly over: boolean;
  readonly state: ChallengeState;
  readonly daysLeft: number;
}

export const wonChallenges = (list: readonly Challenge[]): readonly Challenge[] =>
  list.filter((c) => c.status === 'won');

export function evalChallenge(ctx: Ctx, ch: Challenge, habit: Habit): ChallengeEval {
  const { db } = ctx;
  const mid = midnight(ctx);
  const start = parseDate(ch.start);
  const todayKey = today(ctx);
  let success = 0;
  let activeTotal = 0;
  let pending = 0;

  for (let i = 0; i < ch.days; i++) {
    const day = addDays(start, i);
    const key = fmtDate(day);
    if (!isDayActive(db, habit, day, key)) continue;
    activeTotal++;
    if (day > mid) {
      pending++;
      continue;
    }
    const isToday = key === todayKey;
    if (habit.type === 'bad') {
      if (isBadFail(db, habit.id, key)) continue;
      if (isToday) pending++;
      else success++;
    } else if (isHabitDoneOn(db, habit, key, day)) success++;
    else if (isToday) pending++;
  }

  const required = ch.required === 'all' ? activeTotal : Math.min(Number(ch.required) || 1, activeTotal);
  const dayNo = Math.min(ch.days, Math.max(1, Math.round((mid.getTime() - start.getTime()) / 864e5) + 1));
  const over = mid > addDays(start, ch.days - 1);

  let state: ChallengeState = 'active';
  if (activeTotal === 0) {
    if (over) state = 'void';
  } else if (success >= required) state = 'won';
  else if (success + pending < required) state = 'failed';

  return { success, pending, required, activeTotal, dayNo, over, state, daysLeft: Math.max(0, ch.days - dayNo) };
}

export function chalTitle(habit: Habit, days: number, mode: 'all' | 'min', min: number): string {
  if (habit.type === 'bad') return `${days} jours sans ${habit.name}`;
  if (mode === 'min') return `${habit.name} · ${min} fois en ${days} jours`;
  return `${habit.name} · ${days} jours d’affilée`;
}

/** Nombre de jours actifs d'une habitude sur les `days` prochains jours (à partir d'aujourd'hui). */
export function chalActiveDays(ctx: Ctx, habit: Habit, days: number): number {
  const mid = midnight(ctx);
  let n = 0;
  for (let i = 0; i < days; i++) if (isDayActive(ctx.db, habit, addDays(mid, i))) n++;
  return n;
}

export const chalRewardFor = (requiredDays: number): number => Math.round(10 + requiredDays * 3);

export const chalEndKey = (ch: Challenge): DateKey => fmtDate(addDays(parseDate(ch.start), ch.days - 1));
