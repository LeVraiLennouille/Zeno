import { DAY_FULL, MONTH_NAMES, MONTH_SHORT } from '../constants/calendar';
import { PAUSE_PAST_DAYS, PAUSE_REASONS, type PauseReasonInfo } from '../constants/pause';
import { addDays, fmtDate, parseDate } from '../date/calendar';
import { midnight, today, type Ctx } from '../date/clock';
import {
  pauseBounds,
  pauseQuota,
  pauseRangeSummary,
  pauseReasonInfo,
  pausesInMonth,
  pausesLeft,
} from '../pause/pause';
import type { DateKey, MonthKey } from '../types/date';
import type { PauseReason } from '../types/db';

export type PauseBanner =
  | { readonly kind: 'none' }
  | { readonly kind: 'paused'; readonly date: DateKey; readonly reason: PauseReasonInfo }
  | { readonly kind: 'pill'; readonly left: number; readonly quota: number };

/** Bandeau de l'accueil : « Jour de pause · Reprendre » ou la pastille « Pause 2/3 ce mois-ci ». */
export function pauseBanner(ctx: Ctx): PauseBanner {
  const key = today(ctx);
  const pause = ctx.db.pauses[key];
  if (pause) return { kind: 'paused', date: key, reason: pauseReasonInfo(pause.reason) };
  const quota = pauseQuota(ctx.db);
  if (quota === 0 && Object.keys(ctx.db.pauses).length === 0) return { kind: 'none' };
  return { kind: 'pill', left: pausesLeft(ctx.db, key.slice(0, 7) as MonthKey), quota };
}

export interface PauseFormState {
  readonly from: DateKey;
  readonly to: DateKey;
  readonly reason: PauseReason;
}

export const startPauseForm = (ctx: Ctx, date?: DateKey): PauseFormState => {
  const d = date ?? today(ctx);
  return { from: d, to: d, reason: 'sick' };
};

/** Change un champ ; la fin ne peut jamais précéder le début. */
export function setPauseField<K extends keyof PauseFormState>(form: PauseFormState, key: K, value: PauseFormState[K]): PauseFormState {
  const next = { ...form, [key]: value } as PauseFormState;
  return next.to < next.from ? { ...next, to: next.from } : next;
}

export function pausePreset(ctx: Ctx, preset: 'today' | 'yesterday', form: PauseFormState): PauseFormState {
  const t = midnight(ctx);
  const d = fmtDate(preset === 'yesterday' ? addDays(t, -1) : t);
  return { ...form, from: d, to: d };
}

export interface PauseFormModel {
  readonly bounds: { readonly min: DateKey; readonly max: DateKey };
  readonly status: { readonly ok: boolean; readonly text: string };
  readonly recent: readonly { readonly date: DateKey; readonly label: string; readonly emoji: string; readonly reason: string }[];
  readonly reasons: readonly PauseReasonInfo[];
}

const monthName = (key: string): string => (MONTH_NAMES[Number(key.slice(5)) - 1] ?? '').toLowerCase();

export function pauseFormModel(ctx: Ctx, form: PauseFormState): PauseFormModel {
  const { db } = ctx;
  const { days, byMonth } = pauseRangeSummary(db, form.from, form.to);
  const quota = pauseQuota(db);
  const month = form.from.slice(0, 7);
  const left = pausesLeft(db, month as MonthKey);
  const over = Object.entries(byMonth).find(([m, n]) => n > pausesLeft(db, m as MonthKey));
  let status: PauseFormModel['status'];
  if (days.length === 0) status = { ok: true, text: 'Ces jours sont déjà en pause.' };
  else if (over) {
    status = { ok: false, text: `Quota dépassé : il reste ${pausesLeft(db, over[0] as MonthKey)} jour(s) de pause en ${monthName(over[0])}.` };
  } else {
    status = {
      ok: true,
      text: `${days.length} jour${days.length > 1 ? 's' : ''} de pause · il restera ${Math.max(0, left - (byMonth[month] ?? 0))}/${quota} en ${monthName(month)}.`,
    };
  }
  const since = fmtDate(addDays(parseDate(today(ctx)), -PAUSE_PAST_DAYS));
  const recent = (Object.keys(db.pauses) as DateKey[])
    .filter((k) => k >= since)
    .sort()
    .map((date) => {
      const info = pauseReasonInfo(db.pauses[date]?.reason ?? 'other');
      const d = parseDate(date);
      return {
        date,
        emoji: info.emoji,
        reason: info.label,
        label: `${(DAY_FULL[d.getDay()] ?? '').slice(0, 3)}. ${d.getDate()} ${(MONTH_SHORT[d.getMonth()] ?? '').toLowerCase()}`,
      };
    });
  return { bounds: pauseBounds(ctx), status, recent, reasons: PAUSE_REASONS };
}

export interface PauseSectionModel {
  readonly quota: number;
  readonly usedThisMonth: number;
}

export const pauseSectionModel = (ctx: Ctx): PauseSectionModel => ({
  quota: pauseQuota(ctx.db),
  usedThisMonth: pausesInMonth(ctx.db, today(ctx).slice(0, 7) as MonthKey),
});
