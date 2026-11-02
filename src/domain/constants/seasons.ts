export interface SeasonDef {
  readonly key: 'winter' | 'spring' | 'summer' | 'autumn';
  readonly name: string;
  readonly emoji: string;
  /** Mois (0 = janvier) couverts par la saison. */
  readonly months: readonly number[];
}

export const SEASON_DEFS: readonly SeasonDef[] = [
  { key: 'winter', name: 'Hiver', emoji: '❄️', months: [11, 0, 1] },
  { key: 'spring', name: 'Printemps', emoji: '🌸', months: [2, 3, 4] },
  { key: 'summer', name: 'Été', emoji: '☀️', months: [5, 6, 7] },
  { key: 'autumn', name: 'Automne', emoji: '🍂', months: [8, 9, 10] },
];

export interface SeasonRankDef {
  readonly xp: number;
  readonly name: string;
}

export const SEASON_RANKS: readonly SeasonRankDef[] = [
  { xp: 0, name: 'Éveil' },
  { xp: 300, name: 'Élan' },
  { xp: 700, name: 'Rythme' },
  { xp: 1200, name: 'Flux' },
  { xp: 1800, name: 'Cap' },
  { xp: 2500, name: 'Ascension' },
  { xp: 3300, name: 'Sommet' },
  { xp: 4200, name: 'Éclat' },
  { xp: 5200, name: 'Maîtrise' },
  { xp: 6300, name: 'Légende' },
  { xp: 7500, name: 'Mythe' },
  { xp: 9000, name: 'Éternité' },
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;

export const CHAL_DURATIONS = [7, 14, 21, 30, 60, 90] as const;
export const CHAL_MAX_ACTIVE = 5;
export const CHAL_MIN_DAYS = 3;
export const CHAL_MAX_DAYS = 365;
