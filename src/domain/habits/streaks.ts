import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { appNow, today, type Ctx } from '../date/clock';
import { weekPausedCount } from '../pause/pause';
import type { Habit } from '../types/habit';
import { isDayActive } from './activity';
import { calcTimesStreak } from './times';
import { isBadFail, isCounterDone, isDrinkDone, isWeeklyDoneForWeek } from './values';

export interface Streak {
  readonly current: number;
  readonly longest: number;
}

/** Série en semaines pour une habitude hebdomadaire (≥ 3 jours de pause dans la semaine = semaine « gelée »). */
export function calcWeeklyStreak(ctx: Ctx, habit: Habit): number {
  const { db } = ctx;
  const thisMonday = getWeekMonday(appNow(ctx));
  const start = isWeeklyDoneForWeek(db, habit.id, thisMonday) ? 0 : 1;
  let streak = 0;
  for (let i = start; i < 104; i++) {
    const monday = fmtDate(addDays(parseDate(thisMonday), -i * 7));
    if (monday < db.createdAt) break;
    if (!isWeeklyDoneForWeek(db, habit.id, monday)) {
      if (weekPausedCount(db, monday) >= 3) continue;
      break;
    }
    streak++;
  }
  return streak;
}

/** Série en cours et série record d'une habitude, quel que soit son type. */
export function calcStreak(ctx: Ctx, habit: Habit): Streak {
  if (habit.type === 'times') return calcTimesStreak(ctx, habit);
  if (habit.type === 'weekly') {
    const n = calcWeeklyStreak(ctx, habit);
    return { current: n, longest: n };
  }

  const { db } = ctx;
  const todayKey = today(ctx);
  const created = db.createdAt;

  if (habit.type === 'bad') {
    let current = 0;
    let cursor = appNow(ctx);
    for (let i = 0; i < 730; i++) {
      const k = fmtDate(cursor);
      if (k < created) break;
      if (!isDayActive(db, habit, cursor, k)) {
        cursor = addDays(cursor, -1);
        continue;
      }
      if (isBadFail(db, habit.id, k)) break;
      if (k <= todayKey) current++;
      cursor = addDays(cursor, -1);
    }
    let best = 0;
    let run = 0;
    for (let d = parseDate(created); fmtDate(d) <= todayKey; d = addDays(d, 1)) {
      const k = fmtDate(d);
      if (!isDayActive(db, habit, d, k)) continue;
      if (isBadFail(db, habit.id, k)) run = 0;
      else {
        run++;
        best = Math.max(best, run);
      }
    }
    return { current, longest: Math.max(current, best) };
  }

  const isDone = (k: ReturnType<typeof fmtDate>): boolean => {
    if (habit.type === 'drink') return isDrinkDone(db, k);
    if (habit.type === 'counter') return isCounterDone(db, habit, k);
    return db.habits[habit.id]?.logs[k] === 'done';
  };

  // Aujourd'hui compte s'il est fait, ou s'il n'est pas dû ; sinon la série part de la veille.
  const now = appNow(ctx);
  let cursor = now;
  if (!(isDone(todayKey) || !isDayActive(db, habit, now))) cursor = addDays(cursor, -1);
  let current = 0;
  for (let i = 0; i < 730; i++) {
    const k = fmtDate(cursor);
    if (k < created) break;
    if (!isDayActive(db, habit, cursor, k)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isDone(k)) current++;
    else break;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  for (let d = parseDate(created); fmtDate(d) <= todayKey; d = addDays(d, 1)) {
    const k = fmtDate(d);
    if (!isDayActive(db, habit, d, k)) continue;
    if (isDone(k)) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  return { current, longest: Math.max(current, best) };
}
