import { DAY_FULL, MONTH_SHORT } from '../constants/calendar';
import { MOOD_EMOJIS, MOOD_LABELS } from '../constants/gamification';
import { parseDate } from '../date/calendar';
import { appNow, type Ctx } from '../date/clock';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';

export const JOURNAL_PAGE = 5;
export const JOURNAL_MORE = 10;

export const journalKeys = (db: Db): DateKey[] =>
  (Object.keys(db.journal) as DateKey[]).filter((k) => db.journal[k]).sort().reverse();

/** « Mer. 28 oct » (l'année est ajoutée si ce n'est pas l'année en cours). */
export function journalDateLabel(ctx: Ctx, date: DateKey): string {
  const d = parseDate(date);
  const year = d.getFullYear() !== appNow(ctx).getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${(DAY_FULL[d.getDay()] ?? '').slice(0, 3)}. ${d.getDate()} ${(MONTH_SHORT[d.getMonth()] ?? '').toLowerCase()}${year}`;
}

export interface JournalEntry {
  readonly date: DateKey;
  readonly label: string;
  readonly emoji: string;
  readonly moodLabel: string | null;
  readonly feelings: readonly string[];
  readonly text: string;
}

export interface JournalModel {
  readonly total: number;
  readonly showSearch: boolean;
  readonly entries: readonly JournalEntry[];
  /** Notes non affichées (bouton « Voir plus »), toujours 0 pendant une recherche. */
  readonly remaining: number;
  readonly emptyText: string | null;
}

export function journalModel(ctx: Ctx, query: string, limit: number): JournalModel {
  const { db } = ctx;
  const all = journalKeys(db);
  const q = query.trim().toLowerCase();
  const matching = q ? all.filter((k) => (db.journal[k] ?? '').toLowerCase().includes(q)) : all;
  const shown = q ? matching : matching.slice(0, limit);
  const entries = shown.map((date): JournalEntry => {
    const mood = db.moods[date];
    const feelings = db.profile.moodFeelings[date];
    return {
      date,
      label: journalDateLabel(ctx, date),
      emoji: (mood && MOOD_EMOJIS[mood]) || '📝',
      moodLabel: mood ? (MOOD_LABELS[mood] ?? null) : null,
      feelings: feelings ? feelings.split(',').slice(0, 4) : [],
      text: db.journal[date] ?? '',
    };
  });
  return {
    total: all.length,
    showSearch: all.length >= 3,
    entries,
    remaining: !q && matching.length > shown.length ? matching.length - shown.length : 0,
    emptyText:
      matching.length > 0
        ? null
        : q
          ? 'Aucune note ne correspond à ta recherche.'
          : 'Aucune note pour l’instant. Écris-en une quand tu enregistres ton humeur.',
  };
}
