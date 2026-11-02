import { DRINK_GOAL, DRINK_ID, DRINK_MAX, DRINK_STEP } from '../constants/habits';
import { getWeekMonday, addDays, fmtDate, parseDate } from '../date/calendar';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';
import type { Habit, NumericHabit } from '../types/habit';

export interface DrinkConfig {
  readonly goal: number;
  readonly step: number;
  readonly max: number;
}

/** Paramètres de l'habitude « eau » (active en priorité), avec repli sur les valeurs par défaut. */
export function drinkCfg(db: Db): DrinkConfig {
  const drinks = db.habitDefs.filter((h) => h.type === 'drink');
  const h = drinks.find((x) => !x.archived) ?? drinks[0];
  if (h && h.type === 'drink') {
    return { goal: h.goal || DRINK_GOAL, step: h.step || DRINK_STEP, max: h.max || DRINK_MAX };
  }
  return { goal: DRINK_GOAL, step: DRINK_STEP, max: DRINK_MAX };
}

/**
 * Millilitres bus un jour donné. Gère l'ancien format où l'eau était cochée
 * (`"done"` = objectif atteint).
 */
export function getDrinkMl(db: Db, key: DateKey): number {
  const log = db.habits[DRINK_ID];
  if (!log) return 0;
  const v = log.logs[key];
  if (typeof v === 'number') return v;
  return v === 'done' ? drinkCfg(db).goal : 0;
}

export const isDrinkDone = (db: Db, key: DateKey): boolean => getDrinkMl(db, key) >= drinkCfg(db).goal;

export function getCounterVal(db: Db, habitId: string, key: DateKey): number {
  const v = db.habits[habitId]?.logs[key];
  return typeof v === 'number' ? v : 0;
}

export const isCounterDone = (db: Db, habit: NumericHabit, key: DateKey): boolean =>
  getCounterVal(db, habit.id, key) >= habit.goal;

export const isBadFail = (db: Db, habitId: string, key: DateKey): boolean =>
  db.habits[habitId]?.logs[key] === 'fail';

/** Palier enregistré pour un échec « à éviter » par durée (chaîne vide si aucun). */
export const badVal = (db: Db, habitId: string, key: DateKey): string =>
  db.habits[habitId]?.vals?.[key] ?? '';

/** Une validation hebdomadaire dans la semaine commençant le lundi `monday`. */
export function isWeeklyDoneForWeek(db: Db, habitId: string, monday: DateKey): boolean {
  const logs = db.habits[habitId]?.logs;
  if (!logs) return false;
  const start = parseDate(monday);
  for (let i = 0; i < 7; i++) {
    if (logs[fmtDate(addDays(start, i))] === 'done') return true;
  }
  return false;
}

export interface HabitProgress {
  readonly v: number;
  readonly goal: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
}

export function habitProgress(db: Db, habit: NumericHabit, key: DateKey): HabitProgress {
  if (habit.type === 'drink') {
    const c = drinkCfg(db);
    return { v: getDrinkMl(db, key), goal: c.goal, max: c.max, step: c.step, unit: 'ml' };
  }
  return {
    v: getCounterVal(db, habit.id, key),
    goal: habit.goal,
    max: habit.max,
    step: habit.step,
    unit: habit.unit,
  };
}

/**
 * Valeur d'une habitude un jour donné, entre 0 et 1 (1 = réussie).
 * `day` évite de re-parser `key` quand l'appelant a déjà la `Date`.
 */
export function getHabitDayValue(db: Db, habit: Habit, key: DateKey, day?: Date): number {
  switch (habit.type) {
    case 'drink':
      return isDrinkDone(db, key) ? 1 : 0;
    case 'counter':
      return isCounterDone(db, habit, key) ? 1 : getCounterVal(db, habit.id, key) / habit.goal;
    case 'weekly': {
      const monday = getWeekMonday(day ?? parseDate(key));
      return isWeeklyDoneForWeek(db, habit.id, monday) ? 1 : 0;
    }
    case 'bad':
      return isBadFail(db, habit.id, key) ? 0 : 1;
    case 'good':
    case 'times':
      return db.habits[habit.id]?.logs[key] === 'done' ? 1 : 0;
  }
}

export const isHabitDoneOn = (db: Db, habit: Habit, key: DateKey, day?: Date): boolean =>
  getHabitDayValue(db, habit, key, day) === 1;

/** Progression 0-1 pour une barre (compteur/eau plafonnés à l'objectif). */
export function dayProgress(db: Db, habit: Habit, key: DateKey, day?: Date): number {
  if (habit.type === 'drink' || habit.type === 'counter') {
    const p = habitProgress(db, habit, key);
    return Math.min(1, p.v / p.goal);
  }
  return getHabitDayValue(db, habit, key, day);
}
