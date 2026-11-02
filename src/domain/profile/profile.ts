import { clampDayStartHour } from '../date/clock';
import { Tx } from '../actions/tx';
import type { Clock } from '../date/clock';
import type { Db, ThemeMode } from '../types/db';

export const AVATAR_EMOJIS = [
  '😀', '😎', '🥳', '🤓', '😴', '🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🦄',
  '🐙', '🦉', '🐢', '🔥', '⚡', '🌙', '🌈', '🍀', '🚀', '🎧', '🏆', '💪',
] as const;
export const AVATAR_DEFAULT = '🙂';

export const avatarEmoji = (db: Db): string => (db.profile.avatar.trim() ? db.profile.avatar : AVATAR_DEFAULT);

/** Premier « caractère visible » (graphème) d'une saisie : un emoji composé reste entier. */
export function firstGlyph(value: string): string {
  const v = String(value || '').trim();
  if (!v) return '';
  try {
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
    if (Seg) {
      for (const part of new Seg(undefined, { granularity: 'grapheme' }).segment(v)) return part.segment;
    }
  } catch {
    /* repli ci-dessous */
  }
  return Array.from(v)[0] ?? '';
}

type Patched = (db: Db, clock: Clock, fn: (tx: Tx) => void) => Db;
const patched: Patched = (db, clock, fn) => {
  const tx = new Tx(db, clock);
  fn(tx);
  return tx.db;
};

export type ToggleablePref = 'sound' | 'zen' | 'review' | 'notifications';

export function setProfileName(db: Db, clock: Clock, name: string): Db {
  return patched(db, clock, (tx) => tx.patch({ profile: { ...db.profile, name: name.trim().slice(0, 40) } }));
}

export function togglePref(db: Db, clock: Clock, pref: ToggleablePref): Db {
  const p = db.profile;
  const profile =
    pref === 'sound' ? { ...p, soundEnabled: !p.soundEnabled }
    : pref === 'zen' ? { ...p, zenMode: !p.zenMode }
    : pref === 'review' ? { ...p, weeklyReview: !p.weeklyReview }
    : { ...p, notifsEnabled: !p.notifsEnabled };
  return patched(db, clock, (tx) => tx.patch({ profile }));
}

export function setThemeMode(db: Db, clock: Clock, mode: ThemeMode): Db {
  return patched(db, clock, (tx) => tx.patch({ profile: { ...db.profile, themeMode: mode, darkMode: mode === 'dark' } }));
}

export function setDayStartHour(db: Db, clock: Clock, hour: number): Db {
  return patched(db, clock, (tx) => tx.patch({ profile: { ...db.profile, dayStartHour: clampDayStartHour(hour) } }));
}

/** `null` = retour à l'emoji par défaut. Une saisie vide est ignorée. */
export function setAvatar(db: Db, clock: Clock, value: string | null): Db {
  const glyph = value === null ? '' : firstGlyph(value);
  if (value !== null && !glyph) return db;
  return patched(db, clock, (tx) => tx.patch({ profile: { ...db.profile, avatar: glyph.slice(0, 16) } }));
}

export const dayStartLabel = (hour: number): string => (hour === 0 ? 'Minuit' : `${String(hour).padStart(2, '0')}:00`);

export const dayStartHint = (hour: number): string =>
  hour === 0
    ? 'Les jours changent à minuit'
    : `Avant ${String(hour).padStart(2, '0')}:00, tu es encore dans la journée de la veille`;
