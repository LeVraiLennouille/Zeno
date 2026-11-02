/** Identifiant court et unique, même forme que la PWA (`c_lq3x9ab`). */
export const makeId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
