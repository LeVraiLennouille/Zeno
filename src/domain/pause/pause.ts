import { MONTH_NAMES } from '../constants/calendar';
import {
  PAUSE_DEFAULT_QUOTA,
  PAUSE_FUTURE_DAYS,
  PAUSE_MAX_QUOTA,
  PAUSE_MAX_RANGE,
  PAUSE_PAST_DAYS,
  PAUSE_REASONS,
  type PauseReasonInfo,
} from '../constants/pause';
import { addDays, fmtDate, parseDate } from '../date/calendar';
import { midnight, today, type Ctx } from '../date/clock';
import { monthOf, type DateKey, type MonthKey } from '../types/date';
import type { Db } from '../types/db';
import { isPaused } from '../habits/activity';

export { isPaused };

export const pauseReasonInfo = (id: string): PauseReasonInfo =>
  PAUSE_REASONS.find((r) => r.id === id) ?? PAUSE_REASONS[5]!;

/** Quota mensuel de jours de pause. */
export const pauseQuota = (db: Db): number =>
  Number.isFinite(db.profile.pauseQuota) ? db.profile.pauseQuota : PAUSE_DEFAULT_QUOTA;

export const pausesInMonth = (db: Db, month: MonthKey): number =>
  (Object.keys(db.pauses) as DateKey[]).filter((k) => k.startsWith(month)).length;

export const pausesLeft = (db: Db, month: MonthKey): number =>
  Math.max(0, pauseQuota(db) - pausesInMonth(db, month));

/** Nombre de jours de pause dans la semaine commençant le lundi `monday`. */
export function weekPausedCount(db: Db, monday: DateKey): number {
  const start = parseDate(monday);
  let n = 0;
  for (let i = 0; i < 7; i++) if (isPaused(db, fmtDate(addDays(start, i)))) n++;
  return n;
}

/** Fenêtre dans laquelle une pause peut être posée. */
export function pauseBounds(ctx: Ctx): { min: DateKey; max: DateKey } {
  const t = midnight(ctx);
  let min = addDays(t, -PAUSE_PAST_DAYS);
  const created = parseDate(ctx.db.createdAt);
  if (created > min) min = created;
  return { min: fmtDate(min), max: fmtDate(addDays(t, PAUSE_FUTURE_DAYS)) };
}

/** Jours d'une plage `from → to` (40 jours max, comme l'ancienne boucle). */
export function pauseRangeDays(from: DateKey, to: DateKey): DateKey[] {
  const days: DateKey[] = [];
  let t = parseDate(from);
  const end = parseDate(to);
  for (let i = 0; i < 40 && t <= end; i++) {
    days.push(fmtDate(t));
    t = addDays(t, 1);
  }
  return days;
}

export interface PauseRangeSummary {
  /** Jours de la plage qui ne sont pas déjà en pause. */
  readonly days: readonly DateKey[];
  readonly byMonth: Readonly<Record<string, number>>;
}

export function pauseRangeSummary(db: Db, from: DateKey, to: DateKey): PauseRangeSummary {
  const days = pauseRangeDays(from, to).filter((k) => !isPaused(db, k));
  const byMonth: Record<string, number> = {};
  for (const k of days) {
    const m = monthOf(k);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  }
  return { days, byMonth };
}

export const monthLabel = (month: MonthKey): string =>
  (MONTH_NAMES[Number(month.slice(5)) - 1] ?? '').toLowerCase();

export const currentMonth = (ctx: Ctx): MonthKey => monthOf(today(ctx));
export { PAUSE_MAX_QUOTA, PAUSE_MAX_RANGE };
