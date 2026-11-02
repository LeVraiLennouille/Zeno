export const HABIT_COLORS = [
  '#8EA2FF', '#C79BFF', '#FFD23F', '#52E0A1', '#FF8A4C', '#2EC4B6',
  '#52C7F2', '#FF7EB0', '#C3E34A', '#FF6B6B', '#F7B267', '#9BE0C4',
] as const;

export const HABIT_EMOJIS = [
  '⭐', '🎯', '🧘', '🍎', '🥗', '💊', '🦷', '🛏️', '🚿', '🎸', '✍️', '🎨',
  '🧠', '🌱', '🐕', '☕', '🚭', '💰', '🏊', '🚴', '🧗', '📝', '🎮', '🌞',
] as const;

export const ALL_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];
/** Ordre d'affichage des jours : lundi en premier. */
export const DOW_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];
export const DOW_LETTER: Readonly<Record<number, string>> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };

/** « water » n'existe que dans le formulaire : il crée un compteur en ml. */
export type HabitFormKind = 'good' | 'counter' | 'water' | 'drink' | 'weekly' | 'bad' | 'times';

export interface KindInfo {
  readonly k: Exclude<HabitFormKind, 'drink'>;
  readonly label: string;
  readonly hint: string;
}

export const KIND_INFO: readonly KindInfo[] = [
  { k: 'good', label: 'Case à cocher', hint: 'Un tap par jour' },
  { k: 'counter', label: 'Compteur', hint: 'Une quantité à atteindre' },
  { k: 'water', label: 'Eau', hint: 'Une boisson, en ml' },
  { k: 'weekly', label: 'Hebdomadaire', hint: 'Une fois par semaine suffit' },
  { k: 'bad', label: 'À éviter', hint: 'Un comportement à limiter' },
  { k: 'times', label: 'X fois / semaine', hint: 'Quels que soient les jours' },
];

export const KIND_DEFAULTS = {
  counter: { goal: 10, step: 1, max: 20, unit: '' },
  water: { goal: 2000, step: 250, max: 5000, unit: 'ml' },
} as const;

export interface BadPreset {
  readonly name: string;
  readonly emoji: string;
  /** Paliers séparés par des virgules ; vide = mode simple. */
  readonly levels: string;
}

export const BAD_PRESETS: readonly BadPreset[] = [
  { name: 'Jeux vidéo', emoji: '🎮', levels: '15 min, 30 min, 1 h, 2 h, +3 h' },
  { name: 'Scroll', emoji: '📱', levels: '15 min, 30 min, 1 h, +2 h' },
  { name: 'Films / séries', emoji: '🎬', levels: '1, 2, +3' },
  { name: 'Sucre ajouté', emoji: '🍬', levels: '' },
  { name: 'Alcool', emoji: '🍷', levels: '' },
  { name: 'Tabac', emoji: '🚬', levels: '' },
];
