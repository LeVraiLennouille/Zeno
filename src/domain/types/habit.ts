import type { DateKey } from './date';

export const HABIT_TYPES = ['good', 'bad', 'drink', 'counter', 'weekly', 'times'] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

/** Période pendant laquelle une habitude n'existe pas (archivage). `to` absent = période ouverte. */
export interface HabitGap {
  readonly from: DateKey;
  readonly to?: DateKey;
}

/** Champs communs à toutes les habitudes. */
interface HabitBase {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  /** Couleur d'« encre », `#RRGGBB`. */
  readonly color: string;
  /** Libellé de fréquence affiché (« Tous les jours », « 3 fois par semaine »…). */
  readonly freq: string;
  readonly weekdayOnly: boolean;
  /** Jours actifs, 0 = dimanche … 6 = samedi. Absent = tous les jours (ou lun-ven si `weekdayOnly`). */
  readonly activeDays?: readonly number[];
  /** N'entre pas dans la « journée parfaite ». */
  readonly optional?: boolean;
  /** L'habitude n'existe qu'à partir de cette date. */
  readonly since?: DateKey;
  readonly gaps?: readonly HabitGap[];
  readonly archived?: boolean;
  readonly archivedOn?: DateKey;
  readonly custom?: boolean;
}

/** Case à cocher. */
export interface GoodHabit extends HabitBase {
  readonly type: 'good';
}

/** Hebdomadaire : une validation suffit pour la semaine (lun-dim). */
export interface WeeklyHabit extends HabitBase {
  readonly type: 'weekly';
}

/** « À éviter » : journée validée par défaut, un échec casse la série. */
export interface BadHabit extends HabitBase {
  readonly type: 'bad';
  /** Paliers d'écart (ex. « 15 min », « 1 h »). Absent = mode simple. */
  readonly levels?: readonly string[];
}

/** « X fois par semaine » (1 à 6, peu importe les jours). */
export interface TimesHabit extends HabitBase {
  readonly type: 'times';
  readonly target: number;
}

interface NumericFields {
  readonly step: number;
  readonly goal: number;
  readonly max: number;
  readonly unit: string;
}

/** Compteur (km, pas, minutes…). */
export interface CounterHabit extends HabitBase, NumericFields {
  readonly type: 'counter';
}

/** Eau (millilitres). Il n'en existe qu'une, d'identifiant `drink`. */
export interface DrinkHabit extends HabitBase, NumericFields {
  readonly type: 'drink';
}

export type NumericHabit = CounterHabit | DrinkHabit;

/** Union discriminée par `type` : le compilateur force à traiter chaque cas. */
export type Habit =
  | GoodHabit
  | WeeklyHabit
  | BadHabit
  | TimesHabit
  | CounterHabit
  | DrinkHabit;

/** Valeur journalière enregistrée : coche, échec (bad) ou quantité (compteur / eau). */
export type LogValue = 'done' | 'fail' | number;

export interface HabitLog {
  readonly logs: Readonly<Record<DateKey, LogValue>>;
  /** Palier choisi pour un échec « à éviter » par durée. */
  readonly vals?: Readonly<Record<DateKey, string>>;
}

export const isNumericHabit = (h: Habit): h is NumericHabit =>
  h.type === 'counter' || h.type === 'drink';
