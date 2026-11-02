import { MONTH_SHORT } from './constants/calendar';
import { parseDate } from './date/calendar';
import type { DateKey } from './types/date';

/** Nombre au format français (« 10 000 »), comme `fmtNum` de la PWA. */
export const fmtNum = (n: number): string => Number(n).toLocaleString('fr-FR');

/** « 28 oct » : jour et mois abrégé, comme `fmtDay` de la PWA. */
export const fmtDay = (key: DateKey): string => {
  const d = parseDate(key);
  return `${d.getDate()} ${(MONTH_SHORT[d.getMonth()] ?? '').toLowerCase()}`;
};
