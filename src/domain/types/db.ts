import type { ByDate, DateKey } from './date';
import type { Habit, HabitLog } from './habit';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const PAUSE_REASON_IDS = ['sick', 'trip', 'tired', 'work', 'party', 'other'] as const;
export type PauseReason = (typeof PAUSE_REASON_IDS)[number];

export interface Pause {
  readonly reason: PauseReason;
}

export interface SleepEntry {
  readonly hours: number;
  readonly minutes: number;
  /** `HH:MM` ou chaîne vide. */
  readonly bedtime: string;
  readonly wakeTime: string;
}

export interface Reminder {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly hour: number;
  readonly minute: number;
  /** 0 = dimanche … 6 = samedi. */
  readonly days: readonly number[];
  /** Habitude liée ; chaîne vide = aucune. */
  readonly habitId: string;
  readonly enabled: boolean;
}

export const CHALLENGE_STATUSES = ['active', 'won', 'failed', 'abandoned', 'void'] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export interface Challenge {
  readonly id: string;
  readonly habitId: string;
  readonly title: string;
  readonly emoji: string;
  readonly color: string;
  /** Durée en jours (3 à 365). */
  readonly days: number;
  /** `'all'` = chaque jour actif, sinon nombre minimal de jours réussis. */
  readonly required: 'all' | number;
  readonly start: DateKey;
  readonly status: ChallengeStatus;
  readonly reward: number;
  readonly endedOn?: DateKey;
}

export interface Profile {
  readonly name: string;
  readonly avatar: string;
  readonly soundEnabled: boolean;
  readonly notifsEnabled: boolean;
  readonly zenMode: boolean;
  /** Conservé pour compatibilité avec l'export de la PWA. */
  readonly darkMode: boolean;
  readonly themeMode: ThemeMode;
  /** Quota mensuel de jours de pause (0 à 10). */
  readonly pauseQuota: number;
  /** Heure à laquelle la « journée » change (0 à 6). */
  readonly dayStartHour: number;
  readonly weeklyReview: boolean;
  /** Ressentis d'humeur par jour, séparés par des virgules. */
  readonly moodFeelings: ByDate<string>;
  /** Horodatage ISO de la dernière sauvegarde. */
  readonly lastBackup?: string;
  readonly backupSnooze?: DateKey;
  /** Lundi de la dernière semaine dont le bilan a été vu. */
  readonly reviewedWeek?: DateKey;
}

/**
 * Base de données complète : même schéma logique que la clé `ht-v2.6` de la PWA,
 * ce qui permet d'importer telle quelle une sauvegarde existante.
 */
export interface Db {
  readonly createdAt: DateKey;
  readonly xp: number;
  readonly profile: Profile;
  readonly habitDefs: readonly Habit[];
  /** Historique par identifiant d'habitude. */
  readonly habits: Readonly<Record<string, HabitLog>>;
  readonly moods: ByDate<MoodValue>;
  readonly journal: ByDate<string>;
  readonly pauses: ByDate<Pause>;
  /** XP gagnée par semaine (clé = lundi), 20 semaines conservées. */
  readonly xpWeek: ByDate<number>;
  /** Minutes méditées par jour. */
  readonly meditation: ByDate<number>;
  readonly sleepLog: ByDate<SleepEntry>;
  readonly reminders: readonly Reminder[];
  readonly challenges: readonly Challenge[];
  /** XP de saison, clé `winter-2026`. */
  readonly seasonXp: Readonly<Record<string, number>>;
  readonly unlockedAchievements: readonly string[];
  readonly perfectDaysClaimed: readonly DateKey[];
  readonly penaltiesApplied: readonly DateKey[];
  readonly meditationXpDay?: DateKey;
}
