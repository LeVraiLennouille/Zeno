import type { DateKey } from '../types/date';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Date locale → `YYYY-MM-DD`. */
export const fmtDate = (d: Date): DateKey =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` as DateKey;

/** `YYYY-MM-DD` → minuit local de ce jour. */
export const parseDate = (key: DateKey): Date => {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const isWeekend = (d: Date): boolean => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

/** Lundi (clé de date) de la semaine contenant `d`. */
export const getWeekMonday = (d: Date): DateKey => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const offset = t.getDay() === 0 ? 6 : t.getDay() - 1;
  t.setDate(t.getDate() - offset);
  return fmtDate(t);
};

/** Nombre de jours calendaires entre deux dates (arrondi, comme l'ancien `(a - b) / 864e5`). */
export const diffDays = (a: Date, b: Date): number => Math.round((a.getTime() - b.getTime()) / 864e5);
