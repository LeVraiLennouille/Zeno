import { PAUSE_MAX_QUOTA, PAUSE_MAX_RANGE } from '../constants/pause';
import { type Ctx } from '../date/clock';
import {
  pauseBounds,
  pauseQuota,
  pauseRangeDays,
  pauseRangeSummary,
  pausesLeft,
} from '../pause/pause';
import type { DateKey, MonthKey } from '../types/date';
import type { Pause, PauseReason } from '../types/db';
import type { ActionResult, Result } from '../types/events';
import { noop, Tx } from './tx';

export interface PauseInput {
  readonly from: DateKey;
  readonly to: DateKey;
  readonly reason: PauseReason;
}

export type PauseError =
  | { readonly code: 'empty_range' }
  | { readonly code: 'too_long'; readonly max: number }
  | { readonly code: 'out_of_range' }
  | { readonly code: 'already_paused' }
  | { readonly code: 'quota_exceeded'; readonly month: MonthKey; readonly left: number };

/** Pose des jours de pause (qui gèlent les séries) sur la plage `from → to`. */
export function savePause(ctx: Ctx, input: PauseInput): Result<ActionResult & { days: number }, PauseError> {
  const { db } = ctx;
  const bounds = pauseBounds(ctx);
  const range = pauseRangeDays(input.from, input.to);
  if (range.length === 0) return { ok: false, error: { code: 'empty_range' } };
  if (range.length > PAUSE_MAX_RANGE) return { ok: false, error: { code: 'too_long', max: PAUSE_MAX_RANGE } };
  if (range.some((k) => k < bounds.min || k > bounds.max)) return { ok: false, error: { code: 'out_of_range' } };

  const { days, byMonth } = pauseRangeSummary(db, input.from, input.to);
  if (days.length === 0) return { ok: false, error: { code: 'already_paused' } };
  for (const [month, count] of Object.entries(byMonth)) {
    const left = pausesLeft(db, month as MonthKey);
    if (count > left) return { ok: false, error: { code: 'quota_exceeded', month: month as MonthKey, left } };
  }

  const pauses: Record<DateKey, Pause> = { ...db.pauses };
  for (const k of days) pauses[k] = { reason: input.reason };
  const tx = new Tx(db, ctx.clock);
  tx.patch({ pauses });
  return { ok: true, value: { ...tx.result(), days: days.length } };
}

export function removePause(ctx: Ctx, key: DateKey): ActionResult {
  if (!ctx.db.pauses[key]) return noop(ctx);
  const pauses: Record<DateKey, Pause> = { ...ctx.db.pauses };
  delete pauses[key];
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ pauses });
  return tx.result();
}

/** Ajuste le quota mensuel de `delta` (borné de 0 à 10). */
export function changePauseQuota(ctx: Ctx, delta: number): ActionResult {
  const next = Math.max(0, Math.min(PAUSE_MAX_QUOTA, pauseQuota(ctx.db) + delta));
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ profile: { ...ctx.db.profile, pauseQuota: next } });
  return tx.result();
}
