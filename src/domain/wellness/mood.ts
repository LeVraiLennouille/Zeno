import { DAY_SHORT, MONTH_NAMES } from '../constants/calendar';
import { FEELINGS_BY_MOOD } from '../constants/gamification';
import { appNow, today, type Ctx } from '../date/clock';
import { fmtDate } from '../date/calendar';
import { Tx } from '../actions/tx';
import { isDateKey, type DateKey } from '../types/date';
import type { Db, MoodValue } from '../types/db';
import type { Result } from '../types/events';

export const JOURNAL_MAX = 600;
export const MOOD_VALUES: readonly MoodValue[] = [1, 2, 3, 4, 5];

export const isMoodValue = (v: unknown): v is MoodValue =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

/** Ressentis proposés pour une humeur. */
export const feelingsFor = (mood: MoodValue): readonly string[] => FEELINGS_BY_MOOD[mood];

/** Ressentis déjà enregistrés ce jour-là, seulement si l'humeur choisie est la même. */
export function savedFeelings(db: Db, date: DateKey, mood: MoodValue): readonly string[] {
  if (db.moods[date] !== mood) return [];
  const saved = db.profile.moodFeelings[date];
  const allowed = feelingsFor(mood);
  return saved ? saved.split(',').filter((f) => allowed.includes(f)) : [];
}

/** Faut-il proposer l'humeur du jour ? (pas avant la création, pas si déjà saisie). */
export const shouldPromptMood = (ctx: Ctx): boolean => {
  const t = today(ctx);
  return t >= ctx.db.createdAt && ctx.db.moods[t] === undefined;
};

export interface MoodInput {
  readonly date: DateKey;
  readonly value: number;
  readonly feelings: readonly string[];
  readonly journal: string;
}

export type MoodError = 'invalid_mood' | 'invalid_date';

/** Enregistre l'humeur, les ressentis et la note du jour (une note vide la supprime). */
export function saveMood(ctx: Ctx, input: MoodInput): Result<{ db: Db; hasNote: boolean; mood: MoodValue }, MoodError> {
  const { db } = ctx;
  if (!isMoodValue(input.value)) return { ok: false, error: 'invalid_mood' };
  if (!isDateKey(input.date) || input.date > today(ctx)) return { ok: false, error: 'invalid_date' };
  const mood = input.value;
  const allowed = feelingsFor(mood);
  const feelings = [...new Set(input.feelings)].filter((f) => allowed.includes(f));
  const note = input.journal.trim().slice(0, JOURNAL_MAX);

  const moodFeelings = { ...db.profile.moodFeelings };
  if (feelings.length > 0) moodFeelings[input.date] = feelings.join(',');
  else delete moodFeelings[input.date];
  const journal = { ...db.journal };
  if (note) journal[input.date] = note;
  else delete journal[input.date];

  const tx = new Tx(db, ctx.clock);
  tx.patch({
    moods: { ...db.moods, [input.date]: mood },
    journal,
    profile: { ...db.profile, moodFeelings },
  });
  return { ok: true, value: { db: tx.db, hasNote: note !== '', mood } };
}

export function deleteJournalNote(ctx: Ctx, date: DateKey): Db {
  if (!ctx.db.journal[date]) return ctx.db;
  const journal = { ...ctx.db.journal };
  delete journal[date];
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ journal });
  return tx.db;
}

// ─────────────── Calendrier ───────────────

export interface MonthRef {
  readonly year: number;
  /** 0 = janvier. */
  readonly month: number;
}

export type MoodCalCell =
  | { readonly kind: 'mood'; readonly day: number; readonly date: DateKey; readonly mood: MoodValue; readonly hasNote: boolean }
  | { readonly kind: 'empty'; readonly day: number; readonly date: DateKey }
  | { readonly kind: 'future'; readonly day: number };

export interface MoodCalendar {
  readonly title: string;
  readonly headers: readonly string[];
  /** Cases vides avant le 1er (semaine commençant le lundi). */
  readonly leading: number;
  readonly cells: readonly MoodCalCell[];
  readonly canGoNext: boolean;
}

export const currentMonthRef = (ctx: Ctx): MonthRef => {
  const now = appNow(ctx);
  return { year: now.getFullYear(), month: now.getMonth() };
};

/** Mois précédent (sans limite) ou suivant (jamais au-delà d'aujourd'hui), comme la PWA. */
export function shiftMonth(ctx: Ctx, ref: MonthRef, delta: -1 | 1): MonthRef {
  const next = new Date(ref.year, ref.month + delta, 1);
  if (delta === 1 && next > appNow(ctx)) return ref;
  return { year: next.getFullYear(), month: next.getMonth() };
}

export function moodCalendar(ctx: Ctx, ref: MonthRef): MoodCalendar {
  const { db } = ctx;
  const first = new Date(ref.year, ref.month, 1);
  const last = new Date(ref.year, ref.month + 1, 0);
  const todayKey = today(ctx);
  const cells: MoodCalCell[] = [];
  for (let day = 1; day <= last.getDate(); day++) {
    const date = fmtDate(new Date(ref.year, ref.month, day));
    const mood = db.moods[date];
    const future = date > todayKey;
    if (mood !== undefined && !future) cells.push({ kind: 'mood', day, date, mood, hasNote: !!db.journal[date] });
    else if (future) cells.push({ kind: 'future', day });
    else cells.push({ kind: 'empty', day, date });
  }
  return {
    title: `${MONTH_NAMES[ref.month]} ${ref.year}`,
    headers: DAY_SHORT.map((d) => d.slice(0, 2)),
    leading: first.getDay() === 0 ? 6 : first.getDay() - 1,
    cells,
    canGoNext: new Date(ref.year, ref.month + 1, 1) <= appNow(ctx),
  };
}
