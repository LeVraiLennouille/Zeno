import type { Db } from './db';

export type SoundId = 'done' | 'undo' | 'fail' | 'drink' | 'fanfare' | 'levelup' | 'bell';

/**
 * Événements émis par les actions du domaine.
 *
 * Le domaine ne joue aucun son et n'affiche aucun toast : il décrit ce qui s'est
 * passé, et la couche interface (`feedback/`) décide quoi en faire.
 *
 * Correspondance avec la PWA d'origine (les délais viennent de ses `setTimeout`) :
 * - `level_up`              → son « levelup » + toast (300 ms)
 * - `season_rank_up`        → son « levelup » + toast (1 800 ms)
 * - `achievement_unlocked`  → son « done » + toast (700 ms × `order`)
 * - `perfect_day`           → confettis + son « fanfare » ; toast « +50 XP » (600 ms) si `bonusXp`
 * - `challenge_won`         → son « fanfare » + confettis + toast (500 ms, +2 600 ms par défi)
 * - `challenge_failed`      → toast (500 ms, +2 600 ms par défi)
 * - `goal_reached`          → toast d'objectif atteint
 * - `times_goal_reached`    → son « drink » + toast
 * - `habit_flash`           → animation de la carte de l'habitude
 * - `meditation_done`       → cloche (puis une seconde fois 2,6 s plus tard) + toast « Session terminée »
 */
export type DomainEvent =
  | { readonly type: 'sound'; readonly sound: SoundId }
  | { readonly type: 'xp_gained'; readonly amount: number }
  | { readonly type: 'level_up'; readonly level: number; readonly name: string }
  | { readonly type: 'season_rank_up'; readonly roman: string; readonly name: string }
  | {
      readonly type: 'achievement_unlocked';
      readonly id: string;
      readonly name: string;
      readonly order: number;
    }
  | {
      readonly type: 'goal_reached';
      readonly habitId: string;
      readonly habitName: string;
      readonly kind: 'drink' | 'counter';
      readonly xp: number;
    }
  | {
      readonly type: 'times_goal_reached';
      readonly habitId: string;
      readonly habitName: string;
      readonly done: number;
      readonly required: number;
    }
  | { readonly type: 'perfect_day'; readonly bonusXp: number | null }
  | {
      readonly type: 'challenge_won';
      readonly id: string;
      readonly title: string;
      readonly reward: number;
    }
  | { readonly type: 'challenge_failed'; readonly id: string; readonly title: string }
  | { readonly type: 'habit_flash'; readonly habitId: string }
  | { readonly type: 'meditation_done'; readonly minutes: number; readonly xp: number | null };

/** Résultat d'une action : nouvel état + événements à présenter. */
export interface ActionResult {
  readonly db: Db;
  readonly events: readonly DomainEvent[];
}

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
