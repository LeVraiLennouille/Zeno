import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { appNow, today, type Ctx } from '../date/clock';
import { isDayActive, isRequiredHabit } from '../habits/activity';
import { getHabitDayValue, isHabitDoneOn } from '../habits/values';

/** Habitudes obligatoires dues aujourd'hui. */
export function requiredToday(ctx: Ctx): number {
  const day = appNow(ctx);
  day.setHours(0, 0, 0, 0);
  return ctx.db.habitDefs.filter((h) => isRequiredHabit(h) && isDayActive(ctx.db, h, day)).length;
}

/** Habitudes obligatoires déjà réussies aujourd'hui. */
export function countDoneToday(ctx: Ctx): number {
  const key = today(ctx);
  const day = appNow(ctx);
  day.setHours(0, 0, 0, 0);
  return ctx.db.habitDefs.filter(
    (h) => isRequiredHabit(h) && isDayActive(ctx.db, h, day) && isHabitDoneOn(ctx.db, h, key, day),
  ).length;
}

/** Une des 12 dernières semaines complètes terminée à 100 % ? */
export function checkPerfectWeek(ctx: Ctx): boolean {
  const { db } = ctx;
  const now = appNow(ctx);
  now.setHours(0, 0, 0, 0);
  for (let w = 1; w <= 12; w++) {
    const monday = addDays(parseDate(getWeekMonday(now)), -(w * 7));
    if (fmtDate(monday) < db.createdAt) break;
    let perfect = true;
    for (let d = 0; d < 7 && perfect; d++) {
      const day = addDays(monday, d);
      if (day > now) continue;
      const key = fmtDate(day);
      if (key < db.createdAt) {
        perfect = false;
        break;
      }
      for (const h of db.habitDefs) {
        if (isRequiredHabit(h) && isDayActive(db, h, day) && getHabitDayValue(db, h, key, day) !== 1) {
          perfect = false;
          break;
        }
      }
    }
    if (perfect) return true;
  }
  return false;
}

/** 20 séances de gym ou plus dans le mois en cours. */
export function checkGymMonth(ctx: Ctx): boolean {
  const gym = ctx.db.habits['gym'];
  if (!gym) return false;
  const month = today(ctx).slice(0, 7);
  return Object.entries(gym.logs).filter(([k, v]) => k.startsWith(month) && v === 'done').length >= 20;
}
