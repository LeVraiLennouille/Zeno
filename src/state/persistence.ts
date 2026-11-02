import { isPlainObj } from '../domain/migrations/guards';
import { LEGACY_STORAGE_KEY, normalizeImported } from '../domain/migrations/import';
import type { DateKey } from '../domain/types/date';
import type { Db } from '../domain/types/db';

export const STORAGE_KEYS = {
  db: 'zeno.db',
  /** Copie illisible, conservée pour ne jamais détruire des données récupérables. */
  corrupt: 'zeno.db.corrupt',
  /** Base d'avant le dernier import (bouton « Annuler l'import »). */
  restorePoint: 'zeno.db.restore',
  /** Présent une fois l'ancien `localStorage` de la PWA repris. */
  legacyImported: 'zeno.legacy.imported',
} as const;

/** Version du format de stockage (indépendante du schéma `ht-v2.6` des sauvegardes). */
export const STORAGE_VERSION = 1;

export interface StoredDb {
  readonly v: number;
  readonly savedAt: string;
  readonly db: Db;
}

export const serializeDb = (db: Db, now: Date): string =>
  JSON.stringify({ v: STORAGE_VERSION, savedAt: now.toISOString(), db } satisfies StoredDb);

export type DeserializeResult =
  | { readonly ok: true; readonly db: Db; readonly savedAt: string | null }
  | { readonly ok: false; readonly reason: 'invalid_json' | 'invalid_shape' };

/** Relit une base stockée : tout passe par le validateur, un fichier abîmé ne casse jamais l'app. */
export function deserializeDb(text: string, todayKey: DateKey): DeserializeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  if (!isPlainObj(parsed)) return { ok: false, reason: 'invalid_shape' };
  const payload = isPlainObj(parsed['db']) ? parsed['db'] : parsed;
  const result = normalizeImported(payload, todayKey);
  if (!result.ok) return { ok: false, reason: 'invalid_shape' };
  return { ok: true, db: result.db, savedAt: typeof parsed['savedAt'] === 'string' ? parsed['savedAt'] : null };
}

/** Texte de l'ancienne clé `ht-v2.6` (web uniquement), lu une seule fois. */
export type LegacySource = () => string | null;

export const readLegacyLocalStorage =
  (storage: { getItem(key: string): string | null } | undefined): LegacySource =>
  () => {
    try {
      return storage?.getItem(LEGACY_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  };
