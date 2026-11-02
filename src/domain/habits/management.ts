import { DAY_SHORT } from '../constants/calendar';
import {
  ALL_DAYS,
  BAD_PRESETS,
  HABIT_COLORS,
  WEEKDAYS,
  type BadPreset,
  type HabitFormKind,
} from '../constants/habit-form';
import { TIMES_MAX } from '../constants/habits';
import { addDays, fmtDate } from '../date/calendar';
import { appNow, today, type Ctx } from '../date/clock';
import type { DateKey } from '../types/date';
import type { Challenge, Db } from '../types/db';
import type { Result } from '../types/events';
import type { Habit, HabitLog, HabitType } from '../types/habit';
import { Tx } from '../actions/tx';
import { findHabit } from './activity';
import { drinkCfg, getCounterVal, getDrinkMl } from './values';

export { BAD_PRESETS, type BadPreset };

// ─────────────── Libellés et jours ───────────────

/** « Tous les jours », « Lundi - Vendredi », « Week-end » ou « Lun, Mer, Ven ». */
export function daysLabel(days: readonly number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (sorted.length === 7) return 'Tous les jours';
  if (sorted.length === 5 && WEEKDAYS.every((d) => sorted.includes(d))) return 'Lundi - Vendredi';
  if (sorted.length === 2 && sorted.includes(6) && sorted.includes(0)) return 'Week-end';
  return sorted.map((n) => DAY_SHORT[(n + 6) % 7]).join(', ');
}

/** Jours actifs d'une habitude, sous forme de liste. */
export const habitDays = (h: Habit): readonly number[] =>
  h.activeDays ? [...h.activeDays] : h.weekdayOnly ? WEEKDAYS : ALL_DAYS;

/** Paliers saisis (« 15 min, 1 h ») : 10 caractères max, sans doublon (insensible à la casse). */
export function parseLevels(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of String(text || '').split(',')) {
    const level = raw.trim().slice(0, 10);
    if (level && !seen.has(level.toLowerCase())) {
      seen.add(level.toLowerCase());
      out.push(level);
    }
  }
  return out;
}

// ─────────────── Formulaire ───────────────

/** État du formulaire : tous les champs texte restent des chaînes, comme dans les champs de saisie. */
export interface HabitForm {
  readonly mode: 'create' | 'edit';
  readonly id: string | null;
  /** Habitude livrée par défaut : son emoji n'est pas modifiable. */
  readonly builtin: boolean;
  readonly kind: HabitFormKind;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly days: readonly number[];
  readonly daysTouched: boolean;
  readonly optional: boolean;
  readonly goal: string;
  readonly step: string;
  readonly max: string;
  readonly unit: string;
  readonly levels: string;
  readonly badMode: 'simple' | 'levels';
  readonly target: number;
}

const str = (v: number | undefined): string => (v === undefined ? '' : String(v));

export function emptyHabitForm(db: Db): HabitForm {
  const used = db.habitDefs.map((h) => h.color);
  return {
    mode: 'create',
    id: null,
    builtin: false,
    kind: 'good',
    name: '',
    emoji: '⭐',
    color: HABIT_COLORS.find((c) => !used.includes(c)) ?? HABIT_COLORS[0],
    days: ALL_DAYS,
    daysTouched: true,
    optional: false,
    goal: '',
    step: '',
    max: '',
    unit: '',
    levels: '',
    badMode: 'simple',
    target: 3,
  };
}

export function habitToForm(h: Habit): HabitForm {
  const numeric = h.type === 'counter' || h.type === 'drink';
  return {
    mode: 'edit',
    id: h.id,
    builtin: !h.custom,
    kind: h.type,
    name: h.name,
    emoji: h.emoji || '⭐',
    color: h.color,
    days: habitDays(h),
    daysTouched: false,
    optional: !!h.optional,
    goal: numeric ? str(h.goal) : '',
    step: numeric ? str(h.step) : '',
    max: numeric ? str(h.max) : '',
    unit: numeric ? h.unit : '',
    levels: h.type === 'bad' ? (h.levels ?? []).join(', ') : '',
    badMode: h.type === 'bad' && h.levels ? 'levels' : 'simple',
    target: h.type === 'times' ? h.target : 3,
  };
}

export type HabitFormError =
  | 'name_required'
  | 'name_taken'
  | 'no_day'
  | 'bad_numbers'
  | 'max_below_goal'
  | 'step_above_max'
  | 'no_level';

export interface HabitSaved {
  readonly db: Db;
  readonly habitId: string;
  readonly created: boolean;
  readonly name: string;
}

const num = (v: string | number): number => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const clampTarget = (t: number): number => Math.max(1, Math.min(TIMES_MAX, Math.floor(t) || 3));

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

/** Valide le formulaire puis crée ou met à jour l'habitude (port de `saveHabitForm`). */
export function saveHabit(ctx: Ctx, form: HabitForm, newId: () => string): Result<HabitSaved, HabitFormError> {
  const { db } = ctx;
  const name = form.name.trim();
  if (!name) return { ok: false, error: 'name_required' };
  if (db.habitDefs.some((h) => h.id !== form.id && h.name.trim().toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'name_taken' };
  }
  const { kind } = form;
  const numeric = kind === 'counter' || kind === 'water' || kind === 'drink';
  const isMl = kind === 'water' || kind === 'drink';
  if (kind !== 'weekly' && kind !== 'times' && form.days.length === 0) return { ok: false, error: 'no_day' };

  let goal = 0;
  let step = 0;
  let max = 0;
  if (numeric) {
    goal = num(form.goal);
    step = num(form.step);
    max = num(form.max);
    if (!(goal > 0 && step > 0 && max > 0)) return { ok: false, error: 'bad_numbers' };
    if (max < goal) return { ok: false, error: 'max_below_goal' };
    if (step > max) return { ok: false, error: 'step_above_max' };
  }
  const unit = isMl ? 'ml' : String(form.unit || '').trim().slice(0, 8);

  let levels: string[] | null = null;
  if (kind === 'bad' && form.badMode === 'levels') {
    levels = parseLevels(form.levels).slice(0, 8);
    if (levels.length === 0) return { ok: false, error: 'no_level' };
  }

  const emoji = (form.emoji || '').trim() || '⭐';

  if (form.mode === 'create') {
    const type: HabitType = kind === 'water' ? 'counter' : kind;
    const target = clampTarget(form.target);
    const common = {
      id: newId(),
      name,
      emoji,
      color: form.color,
      custom: true as const,
      since: today(ctx),
      optional: form.optional,
      weekdayOnly: false,
      ...(kind !== 'weekly' && kind !== 'times' && form.days.length < 7 ? { activeDays: [...form.days] } : {}),
    };
    const freq = kind === 'weekly' ? 'Chaque semaine' : kind === 'times' ? `${target} fois par semaine` : daysLabel(form.days);
    let habit: Habit;
    switch (type) {
      case 'counter':
      case 'drink':
        habit = { ...common, type, freq, goal, step, max, unit };
        break;
      case 'times':
        habit = { ...common, type, freq, target };
        break;
      case 'bad':
        habit = levels ? { ...common, type, freq, levels } : { ...common, type, freq };
        break;
      case 'good':
      case 'weekly':
        habit = { ...common, type, freq };
        break;
    }
    const tx = new Tx(db, ctx.clock);
    tx.patch({
      habitDefs: [...db.habitDefs, habit],
      habits: { ...db.habits, [habit.id]: { logs: {} } },
    });
    return { ok: true, value: { db: tx.db, habitId: habit.id, created: true, name } };
  }

  const existing = form.id ? findHabit(db, form.id) : undefined;
  if (!existing) return { ok: true, value: { db, habitId: form.id ?? '', created: false, name } };

  const retouched = (h: Habit): Habit => {
    const base = { name, color: form.color, optional: form.optional, ...(form.builtin ? {} : { emoji }) };
    const daysPatch =
      h.type !== 'weekly' && h.type !== 'times' && form.daysTouched
        ? { weekdayOnly: false, freq: daysLabel(form.days) }
        : {};
    const withDays = <T extends Habit>(x: T): T => {
      if (!('freq' in daysPatch)) return x;
      const cleared = omit(x, 'activeDays') as T;
      return form.days.length === 7 ? { ...cleared, ...daysPatch } : { ...cleared, ...daysPatch, activeDays: [...form.days] };
    };
    switch (h.type) {
      case 'counter':
      case 'drink':
        return withDays({ ...h, ...base, ...(numeric ? { goal, step, max, unit } : {}) });
      case 'bad': {
        const next = { ...h, ...base };
        return withDays(levels ? { ...next, levels } : (omit(next, 'levels') as typeof next));
      }
      case 'times': {
        const target = clampTarget(form.target);
        return { ...h, ...base, target, freq: `${target} fois par semaine` };
      }
      case 'good':
      case 'weekly':
        return withDays({ ...h, ...base });
    }
  };
  const tx = new Tx(db, ctx.clock);
  tx.patch({ habitDefs: db.habitDefs.map((h) => (h.id === existing.id ? retouched(h) : h)) });
  return { ok: true, value: { db: tx.db, habitId: existing.id, created: false, name } };
}

// ─────────────── Archivage, suppression, ordre ───────────────

export const archivedHabits = (db: Db): readonly Habit[] => db.habitDefs.filter((h) => h.archived);

export interface ArchiveUndo {
  readonly habitId: string;
  /** Rappels désactivés par l'archivage (à réactiver à l'annulation). */
  readonly reEnable: readonly string[];
  /** Défis passés en « abandonné » par l'archivage. */
  readonly reactivate: readonly string[];
}

export interface Archived {
  readonly db: Db;
  readonly undo: ArchiveUndo;
}

/** Archive : l'habitude disparaît des listes mais son historique reste ; ses rappels sont coupés. */
export function archiveHabit(ctx: Ctx, id: string): Archived | null {
  const habit = findHabit(ctx.db, id);
  if (!habit || habit.archived) return null;
  const day = today(ctx);
  const reminders = ctx.db.reminders.filter((r) => r.habitId === id && r.enabled);
  const activeChallenges = ctx.db.challenges.filter((c) => c.habitId === id && c.status === 'active');
  const archived: Habit = {
    ...habit,
    archived: true,
    archivedOn: day,
    gaps: [...(habit.gaps ?? []), { from: day }],
  };
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({
    habitDefs: ctx.db.habitDefs.map((h) => (h.id === id ? archived : h)),
    reminders: ctx.db.reminders.map((r) => (r.habitId === id && r.enabled ? { ...r, enabled: false } : r)),
  });
  return {
    db: tx.db,
    undo: { habitId: id, reEnable: reminders.map((r) => r.id), reactivate: activeChallenges.map((c) => c.id) },
  };
}

/** Restaure : ferme la période d'archivage à la veille. */
export function restoreHabit(
  ctx: Ctx,
  id: string,
  opts: { readonly reEnable?: readonly string[]; readonly reactivate?: readonly string[] } = {},
): Db | null {
  const habit = findHabit(ctx.db, id);
  if (!habit || !habit.archived) return null;
  const day = today(ctx);
  const yesterday = fmtDate(addDays(appNow(ctx), -1));
  const gaps = (habit.gaps ?? [])
    .map((g) => (g.to ? g : g.from >= day ? null : { from: g.from, to: yesterday }))
    .filter((g): g is NonNullable<typeof g> => g !== null && (!g.to || g.to >= g.from));
  const withoutArchive = omit(omit(omit(habit, 'archived'), 'archivedOn'), 'gaps') as Habit;
  const restored: Habit = gaps.length ? { ...withoutArchive, gaps } : withoutArchive;
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({
    habitDefs: ctx.db.habitDefs.map((h) => (h.id === id ? restored : h)),
    challenges: ctx.db.challenges.map((c) =>
      opts.reactivate?.includes(c.id) && c.status === 'abandoned' ? (omit({ ...c, status: 'active' as const }, 'endedOn') as Challenge) : c,
    ),
    reminders: ctx.db.reminders.map((r) => (opts.reEnable?.includes(r.id) ? { ...r, enabled: true } : r)),
  });
  return tx.db;
}

export interface PurgeUndo {
  readonly def: Habit;
  readonly index: number;
  readonly data: HabitLog;
  readonly reminderIds: readonly string[];
  readonly challenges: readonly Challenge[];
}

/** Supprime définitivement (historique compris). Renvoie de quoi annuler. */
export function purgeHabit(ctx: Ctx, id: string): { db: Db; undo: PurgeUndo } | null {
  const habit = findHabit(ctx.db, id);
  if (!habit) return null;
  const undo: PurgeUndo = {
    def: habit,
    index: ctx.db.habitDefs.indexOf(habit),
    data: ctx.db.habits[id] ?? { logs: {} },
    reminderIds: ctx.db.reminders.filter((r) => r.habitId === id).map((r) => r.id),
    challenges: ctx.db.challenges.filter((c) => c.habitId === id),
  };
  const habits = { ...ctx.db.habits };
  delete habits[id];
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({
    habitDefs: ctx.db.habitDefs.filter((h) => h.id !== id),
    habits,
    reminders: ctx.db.reminders.map((r) => (r.habitId === id ? { ...r, habitId: '' } : r)),
  });
  return { db: tx.db, undo };
}

export function undoPurge(db: Db, undo: PurgeUndo): Db {
  if (db.habitDefs.some((h) => h.id === undo.def.id)) return db;
  const defs = [...db.habitDefs];
  defs.splice(Math.min(undo.index, defs.length), 0, undo.def);
  const challenges = [...db.challenges];
  for (const c of undo.challenges) {
    const i = challenges.findIndex((x) => x.id === c.id);
    if (i >= 0) challenges[i] = c;
    else challenges.push(c);
  }
  return {
    ...db,
    habitDefs: defs,
    habits: { ...db.habits, [undo.def.id]: undo.data },
    reminders: db.reminders.map((r) => (undo.reminderIds.includes(r.id) ? { ...r, habitId: undo.def.id } : r)),
    challenges,
  };
}

/**
 * Réordonne les habitudes **actives** (les archivées gardent leur place).
 * `ids` doit contenir exactement les habitudes actives, dans le nouvel ordre.
 */
export function applyHabitOrder(db: Db, ids: readonly string[]): Db | null {
  const slots: number[] = [];
  db.habitDefs.forEach((h, i) => {
    if (!h.archived) slots.push(i);
  });
  if (ids.length !== slots.length) return null;
  const byId = new Map(db.habitDefs.map((h) => [h.id, h] as const));
  const picked: Habit[] = [];
  for (const id of ids) {
    const h = byId.get(id);
    if (!h || h.archived) return null;
    picked.push(h);
  }
  const next = [...db.habitDefs];
  picked.forEach((h, n) => {
    const slot = slots[n];
    if (slot !== undefined) next[slot] = h;
  });
  return { ...db, habitDefs: next };
}

/** Décale une habitude active de `delta` rangs (−1 = vers le haut). */
export function moveHabit(db: Db, id: string, delta: number): Db | null {
  const ids = db.habitDefs.filter((h) => !h.archived).map((h) => h.id);
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const a = ids[from];
  const b = ids[to];
  if (a === undefined || b === undefined) return null;
  ids[from] = b;
  ids[to] = a;
  return applyHabitOrder(db, ids);
}

/**
 * Coche / décoche un jour **passé ou présent** depuis la vue Semaine : écrit directement
 * dans l'historique, sans XP, succès ni son (comme `toggleHabitOnDate` de la PWA).
 */
export function toggleHabitOnDate(ctx: Ctx, id: string, date: DateKey): Db {
  const habit = findHabit(ctx.db, id);
  if (!habit || !ctx.db.habits[id]) return ctx.db;
  const tx = new Tx(ctx.db, ctx.clock);
  if (habit.type === 'bad') {
    if (ctx.db.habits[id]?.logs[date] === 'fail') {
      tx.setLog(id, date, undefined);
      tx.setVal(id, date, undefined);
    } else tx.setLog(id, date, 'fail');
  } else if (habit.type === 'counter' || habit.type === 'drink') {
    const goal = habit.type === 'drink' ? drinkCfg(ctx.db).goal : habit.goal;
    const value = habit.type === 'drink' ? getDrinkMl(ctx.db, date) : getCounterVal(ctx.db, id, date);
    tx.setLog(id, date, value >= goal ? undefined : goal);
  } else {
    tx.setLog(id, date, ctx.db.habits[id]?.logs[date] === 'done' ? undefined : 'done');
  }
  return tx.db;
}
