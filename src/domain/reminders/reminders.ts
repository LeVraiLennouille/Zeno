import { DAY_FULL } from '../constants/calendar';
import { ALL_DAYS, WEEKDAYS } from '../constants/habit-form';
import { addDays, fmtDate } from '../date/calendar';
import { appNow, midnight, today, type Ctx } from '../date/clock';
import { Tx } from '../actions/tx';
import { liveHabits } from '../habits/activity';
import { daysLabel } from '../habits/management';
import { timesThisWeek } from '../habits/times';
import { isHabitDoneOn } from '../habits/values';
import type { Db, Reminder } from '../types/db';
import type { Result } from '../types/events';

const pad2 = (n: number): string => String(n).padStart(2, '0');
export const timeOf = (r: Pick<Reminder, 'hour' | 'minute'>): string => `${pad2(r.hour)}:${pad2(r.minute)}`;

/** Prochaine occurrence strictement après `from` (sur 8 jours), ou `null` sans jour actif. */
export function nextOccurrence(r: Reminder, from: Date): Date | null {
  if (!r.days.length) return null;
  for (let i = 0; i < 8; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(r.hour, r.minute, 0, 0);
    if (d > from && r.days.includes(d.getDay())) return d;
  }
  return null;
}

/** Le rappel est inutile : son habitude est déjà faite aujourd'hui (jamais pour les habitudes « à éviter »). */
export function reminderSatisfied(ctx: Ctx, r: Reminder): boolean {
  if (!r.habitId) return false;
  const habit = ctx.db.habitDefs.find((h) => h.id === r.habitId);
  if (!habit || habit.type === 'bad') return false;
  const day = midnight(ctx);
  if (habit.type === 'times' && timesThisWeek(ctx, habit).state === 'success') return true;
  return isHabitDoneOn(ctx.db, habit, today(ctx), day);
}

// ─────────────── Formulaire ───────────────

export interface ReminderForm {
  readonly mode: 'create' | 'edit';
  readonly id: string | null;
  readonly title: string;
  readonly body: string;
  /** `HH:MM`. */
  readonly time: string;
  readonly days: readonly number[];
  readonly habitId: string;
  readonly enabled: boolean;
}

export const emptyReminderForm = (): ReminderForm => ({ mode: 'create', id: null, title: '', body: '', time: '09:00', days: ALL_DAYS, habitId: '', enabled: true });

export const reminderToForm = (r: Reminder): ReminderForm => ({
  mode: 'edit',
  id: r.id,
  title: r.title,
  body: r.body,
  time: timeOf(r),
  days: [...r.days],
  habitId: r.habitId,
  enabled: r.enabled !== false,
});

export const toggleReminderDay = (form: ReminderForm, day: number): ReminderForm => ({
  ...form,
  days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day],
});

export const reminderDaysPreset = (form: ReminderForm, preset: 'all' | 'week'): ReminderForm => ({ ...form, days: preset === 'week' ? WEEKDAYS : ALL_DAYS });

export type ReminderError = 'title_required' | 'bad_time' | 'no_day';

export function saveReminder(ctx: Ctx, form: ReminderForm, newId: () => string): Result<{ db: Db; created: boolean }, ReminderError> {
  const title = form.title.trim();
  if (!title) return { ok: false, error: 'title_required' };
  const m = /^(\d{1,2}):(\d{2})$/.exec(form.time || '');
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { ok: false, error: 'bad_time' };
  if (form.days.length === 0) return { ok: false, error: 'no_day' };
  const fields = {
    title: title.slice(0, 40),
    body: form.body.trim().slice(0, 80),
    hour: Number(m[1]),
    minute: Number(m[2]),
    days: [...form.days],
    habitId: form.habitId || '',
    enabled: form.enabled,
  };
  const tx = new Tx(ctx.db, ctx.clock);
  if (form.mode === 'create') {
    tx.patch({ reminders: [...ctx.db.reminders, { id: newId(), ...fields }] });
    return { ok: true, value: { db: tx.db, created: true } };
  }
  tx.patch({ reminders: ctx.db.reminders.map((r) => (r.id === form.id ? { ...r, ...fields } : r)) });
  return { ok: true, value: { db: tx.db, created: false } };
}

export function toggleReminder(ctx: Ctx, id: string): Db {
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ reminders: ctx.db.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) });
  return tx.db;
}

export function deleteReminder(ctx: Ctx, id: string): Db {
  if (!ctx.db.reminders.some((r) => r.id === id)) return ctx.db;
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ reminders: ctx.db.reminders.filter((r) => r.id !== id) });
  return tx.db;
}

export interface ReminderRow {
  readonly id: string;
  readonly time: string;
  readonly title: string;
  readonly hint: string;
  readonly enabled: boolean;
}

export function remindersModel(ctx: Ctx): readonly ReminderRow[] {
  return [...ctx.db.reminders]
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
    .map((r) => {
      const habit = r.habitId ? ctx.db.habitDefs.find((h) => h.id === r.habitId) : undefined;
      return { id: r.id, time: timeOf(r), title: r.title, hint: daysLabel(r.days) + (habit ? ` · ${habit.name}` : ''), enabled: r.enabled };
    });
}

/** Habitudes proposables dans le formulaire (les « à éviter » n'ont pas de rappel). */
export const reminderHabitOptions = (ctx: Ctx) => liveHabits(ctx.db).filter((h) => h.type !== 'bad');

export const reminderDayName = (d: number): string => DAY_FULL[d] ?? '';

// ─────────────── Planification des notifications ───────────────

export interface PlannedNotification {
  /** Identifiant stable (rappel + date) : sert à détecter les changements. */
  readonly key: string;
  readonly at: Date;
  readonly title: string;
  readonly body: string;
}

/** iOS conserve au plus 64 notifications locales en attente. */
export const MAX_PENDING_NOTIFICATIONS = 60;
export const NOTIFICATION_HORIZON_DAYS = 14;

/**
 * Notifications à programmer dans les `horizonDays` prochains jours.
 * Une occurrence du jour est omise si l'habitude liée est déjà faite : comme le système
 * n'exécute plus rien au moment de sonner, la liste est recalculée à chaque changement.
 */
export function planNotifications(
  ctx: Ctx,
  horizonDays = NOTIFICATION_HORIZON_DAYS,
  max = MAX_PENDING_NOTIFICATIONS,
): readonly PlannedNotification[] {
  const now = ctx.clock.now();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const plan: PlannedNotification[] = [];
  for (const r of ctx.db.reminders) {
    if (!r.enabled || r.days.length === 0) continue;
    const satisfied = reminderSatisfied(ctx, r);
    for (let i = 0; i <= horizonDays; i++) {
      const at = addDays(todayStart, i);
      at.setHours(r.hour, r.minute, 0, 0);
      if (at <= now || !r.days.includes(at.getDay())) continue;
      const isToday = fmtDate(at) === fmtDate(appNow({ db: ctx.db, clock: { now: () => now } }));
      if (isToday && satisfied) continue;
      plan.push({ key: `${r.id}@${at.getTime()}`, at, title: r.title, body: r.body });
    }
  }
  return plan.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, max);
}
