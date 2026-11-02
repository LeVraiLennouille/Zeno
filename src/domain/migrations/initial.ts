import { DEFAULT_HABITS, DEFAULT_REMINDERS } from '../constants/habits';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';
import type { HabitLog } from '../types/habit';

/** Base d'une nouvelle installation (équivalent de `loadData()` sans sauvegarde existante). */
export function createInitialDb(todayKey: DateKey): Db {
  const habits: Record<string, HabitLog> = {};
  for (const h of DEFAULT_HABITS) habits[h.id] = { logs: {} };
  return {
    createdAt: todayKey,
    xp: 0,
    profile: {
      name: '',
      avatar: '',
      soundEnabled: true,
      notifsEnabled: false,
      zenMode: false,
      darkMode: false,
      themeMode: 'light',
      pauseQuota: 3,
      dayStartHour: 0,
      weeklyReview: true,
      moodFeelings: {},
    },
    // Forme normalisée (`optional` toujours présent) : identique à ce que renvoie le validateur à la relecture.
    habitDefs: DEFAULT_HABITS.map((h) => ({ ...h, optional: !!h.optional })),
    habits,
    moods: {},
    journal: {},
    pauses: {},
    xpWeek: {},
    meditation: {},
    sleepLog: {},
    reminders: DEFAULT_REMINDERS,
    challenges: [],
    seasonXp: {},
    unlockedAchievements: [],
    perfectDaysClaimed: [],
    penaltiesApplied: [],
  };
}
