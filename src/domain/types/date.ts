/**
 * Clés de date du domaine.
 *
 * Toutes les dates persistées sont des chaînes locales `YYYY-MM-DD` (comme dans la
 * PWA d'origine). Le type gabarit ci-dessous empêche d'y glisser une chaîne
 * quelconque : on passe soit par `fmtDate()`, soit par le garde `isDateKey()`.
 */
export type DateKey = `${number}-${number}-${number}`;

/** Clé de mois `YYYY-MM`. */
export type MonthKey = `${number}-${number}`;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Reproduit exactement `isDateKey` de l'ancien `backup.js`. */
export function isDateKey(value: unknown): value is DateKey {
  return (
    typeof value === 'string' &&
    DATE_KEY_RE.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00`))
  );
}

/** Convertit une chaîne en `DateKey` ou lève une erreur (usage : constantes, tests). */
export function asDateKey(value: string): DateKey {
  if (!isDateKey(value)) {
    throw new RangeError(`Clé de date invalide : « ${value} »`);
  }
  return value;
}

export const monthOf = (key: DateKey): MonthKey => key.slice(0, 7) as MonthKey;

/** Dictionnaire indexé par date. */
export type ByDate<T> = Readonly<Record<DateKey, T>>;
