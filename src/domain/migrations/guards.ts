import { isDateKey, type ByDate, type DateKey } from '../types/date';

export type PlainObject = Record<string, unknown>;

export const isPlainObj = (v: unknown): v is PlainObject =>
  !!v && typeof v === 'object' && !Array.isArray(v);

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

export const clipStr = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');

/** `Number.isFinite` strict : un nombre ou `fallback`. */
export const nOr = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export const isSafeId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v);

/** Applique `fn` aux valeurs d'un dictionnaire par date ; ignore les clés invalides et les `undefined`. */
export function mapDates<T>(src: unknown, fn: (v: unknown) => T | undefined): ByDate<T> {
  const out: Record<DateKey, T> = {};
  if (!isPlainObj(src)) return out;
  for (const k of Object.keys(src)) {
    if (!isDateKey(k)) continue;
    const v = fn(src[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export const uniqueInts = (v: unknown, min: number, max: number): number[] => [
  ...new Set(
    (Array.isArray(v) ? v : []).filter(
      (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max,
    ),
  ),
];
