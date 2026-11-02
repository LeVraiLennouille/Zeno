import { Tx } from '../actions/tx';
import { today, type Ctx } from '../date/clock';
import { isDateKey, type DateKey } from '../types/date';
import type { Db, SleepEntry } from '../types/db';
import type { Result } from '../types/events';

export interface SleepInput {
  /** Absent = aujourd'hui. */
  readonly date?: DateKey;
  readonly hours: string;
  readonly minutes: string;
  readonly bedtime: string;
  readonly wakeTime: string;
}

export type SleepError = 'invalid_hours' | 'invalid_date';

/**
 * Enregistre une nuit et coche l'habitude « Sommeil » ce jour-là (sans XP).
 * Les minutes sont bornées à 0-59 (la PWA acceptait n'importe quel nombre).
 */
export function saveSleep(ctx: Ctx, input: SleepInput): Result<{ db: Db; hours: number; minutes: number }, SleepError> {
  const hours = parseInt(input.hours, 10);
  if (Number.isNaN(hours) || hours < 0 || hours > 23) return { ok: false, error: 'invalid_hours' };
  const minutes = Math.max(0, Math.min(59, parseInt(input.minutes, 10) || 0));
  const date = input.date ?? today(ctx);
  if (!isDateKey(date) || date > today(ctx)) return { ok: false, error: 'invalid_date' };

  const entry: SleepEntry = { hours, minutes, bedtime: input.bedtime.trim().slice(0, 5), wakeTime: input.wakeTime.trim().slice(0, 5) };
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ sleepLog: { ...ctx.db.sleepLog, [date]: entry } });
  tx.setLog('sleep', date, 'done');
  return { ok: true, value: { db: tx.db, hours, minutes } };
}

export interface SleepSummary {
  readonly entry: SleepEntry | null;
}

export const sleepSummary = (ctx: Ctx): SleepSummary => ({ entry: ctx.db.sleepLog[today(ctx)] ?? null });
