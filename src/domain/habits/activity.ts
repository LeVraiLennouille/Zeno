import { fmtDate, isWeekend } from '../date/calendar';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';
import type { Habit } from '../types/habit';

export const isPaused = (db: Db, key: DateKey): boolean => db.pauses[key] !== undefined;

/** Vrai si `key` tombe dans une période d'archivage de l'habitude. */
export const habitGapAt = (habit: Habit, key: DateKey): boolean =>
  (habit.gaps ?? []).some((g) => key >= g.from && (!g.to || key <= g.to));

/**
 * L'habitude est-elle « due » ce jour-là ? Faux avant sa création, un jour de
 * pause, pendant une période d'archivage, ou hors de ses jours actifs.
 */
export const isDayActive = (db: Db, habit: Habit, day: Date, key?: DateKey): boolean => {
  const k = key ?? fmtDate(day);
  if (habit.since && k < habit.since) return false;
  if (isPaused(db, k)) return false;
  if (habit.gaps && habitGapAt(habit, k)) return false;
  if (habit.activeDays) return habit.activeDays.includes(day.getDay());
  if (habit.weekdayOnly) return !isWeekend(day);
  return true;
};

/** Habitudes non archivées. */
export const liveHabits = (db: Db): readonly Habit[] => db.habitDefs.filter((h) => !h.archived);

/** Compte dans la « journée parfaite » (ni optionnelle, ni « X fois par semaine »). */
export const isRequiredHabit = (h: Habit): boolean => !h.optional && h.type !== 'times';

export const findHabit = (db: Db, id: string): Habit | undefined =>
  db.habitDefs.find((h) => h.id === id);
