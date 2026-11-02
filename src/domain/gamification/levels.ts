import { LEVEL_THRESHOLDS } from '../constants/gamification';

/** Niveau (1 à 10) correspondant à un total d'XP. */
export function calcLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length && xp >= (LEVEL_THRESHOLDS[i] ?? Infinity); i++) {
    level = i + 1;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export interface XpProgress {
  /** Avancement vers le niveau suivant, 0-100. */
  readonly pct: number;
  /** XP restante pour le niveau suivant (0 au niveau max). */
  readonly needed: number;
}

export function xpProgress(xp: number): XpProgress {
  const level = calcLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return { pct: 100, needed: 0 };
  const from = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const to = LEVEL_THRESHOLDS[level] ?? from;
  return { pct: Math.round(((xp - from) / (to - from)) * 100), needed: to - xp };
}
