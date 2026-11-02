import type { Db } from '../types/db';
import type { DateKey } from '../types/date';
import { fmtDate } from './calendar';

/** Source de temps injectable : indispensable pour tester les séries et les défis. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export const fixedClock = (instant: Date): Clock => ({ now: () => new Date(instant.getTime()) });

/**
 * Contexte de lecture : une base + une horloge. Toutes les fonctions du domaine
 * qui dépendent de « aujourd'hui » le reçoivent explicitement, au lieu de lire
 * l'état global (`DB`, `_dayStartHour`) comme dans la PWA.
 */
export interface Ctx {
  readonly db: Db;
  readonly clock: Clock;
}

export const clampDayStartHour = (value: unknown): number =>
  Math.max(0, Math.min(6, Math.floor(Number(value)) || 0));

/** « Maintenant » décalé du début de journée (ex. 3 h du matin = encore la veille si début = 4 h). */
export const appNow = (ctx: Ctx): Date =>
  new Date(ctx.clock.now().getTime() - clampDayStartHour(ctx.db.profile.dayStartHour) * 36e5);

export const today = (ctx: Ctx): DateKey => fmtDate(appNow(ctx));

/** Minuit local du jour courant (au sens « début de journée »). */
export const midnight = (ctx: Ctx): Date => {
  const t = appNow(ctx);
  t.setHours(0, 0, 0, 0);
  return t;
};

/** Millisecondes avant le prochain changement de jour (pour programmer le rafraîchissement de minuit). */
export function msUntilNextDay(ctx: Ctx): number {
  const hour = clampDayStartHour(ctx.db.profile.dayStartHour);
  const now = ctx.clock.now();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return Math.max(1000, next.getTime() - now.getTime());
}
