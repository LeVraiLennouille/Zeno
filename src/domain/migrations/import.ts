import { DEFAULT_HABITS, DEFAULT_REMINDERS } from '../constants/habits';
import { ACHIEVEMENT_IDS } from '../gamification/achievements';
import { isDateKey, type DateKey } from '../types/date';
import {
  CHALLENGE_STATUSES,
  PAUSE_REASON_IDS,
  THEME_MODES,
  type Challenge,
  type Db,
  type MoodValue,
  type Pause,
  type PauseReason,
  type Profile,
  type Reminder,
  type SleepEntry,
} from '../types/db';
import { HABIT_TYPES, type Habit, type HabitGap, type HabitLog, type HabitType, type LogValue } from '../types/habit';
import { clipStr, isHex, isPlainObj, isSafeId, mapDates, nOr, uniqueInts, type PlainObject } from './guards';

/** Schéma de la PWA d'origine (clé `localStorage` et champ `schema` de l'export). */
export const LEGACY_SCHEMA = 'ht-v2.6';
export const LEGACY_STORAGE_KEY = 'ht-v2.6';

export type ImportResult =
  | { readonly ok: true; readonly db: Db }
  | { readonly ok: false; readonly error: string };

const isHabitType = (v: unknown): v is HabitType => HABIT_TYPES.some((t) => t === v);
const isThemeMode = (v: unknown): v is Profile['themeMode'] => THEME_MODES.some((t) => t === v);
const isChallengeStatus = (v: unknown): v is Challenge['status'] => CHALLENGE_STATUSES.some((t) => t === v);
const isPauseReason = (v: unknown): v is PauseReason => PAUSE_REASON_IDS.some((t) => t === v);

function sanitizeHabitDef(raw: unknown): Habit | null {
  if (!isPlainObj(raw) || !isSafeId(raw['id'])) return null;
  const name = clipStr(raw['name'], 30).trim();
  const type = raw['type'];
  if (!name || !isHabitType(type)) return null;

  const activeDays = uniqueInts(raw['activeDays'], 0, 6);
  const gaps: HabitGap[] = Array.isArray(raw['gaps'])
    ? raw['gaps']
        .filter(
          (g): g is PlainObject & { from: DateKey } =>
            isPlainObj(g) && isDateKey(g['from']) && (g['to'] === undefined || isDateKey(g['to'])),
        )
        .map((g): HabitGap => (g['to'] ? { from: g.from, to: g['to'] as DateKey } : { from: g.from }))
        .slice(0, 200)
    : [];

  const base = {
    id: raw['id'],
    name,
    emoji: clipStr(raw['emoji'], 8) || '⭐',
    color: isHex(raw['color']) ? raw['color'] : '#8EA2FF',
    freq: clipStr(raw['freq'], 40) || 'Tous les jours',
    weekdayOnly: !!raw['weekdayOnly'],
    optional: !!raw['optional'],
    ...(activeDays.length ? { activeDays } : {}),
    ...(raw['custom'] ? { custom: true } : {}),
    ...(isDateKey(raw['since']) ? { since: raw['since'] } : {}),
    ...(raw['archived']
      ? { archived: true, ...(isDateKey(raw['archivedOn']) ? { archivedOn: raw['archivedOn'] } : {}) }
      : {}),
    ...(gaps.length ? { gaps } : {}),
  };

  switch (type) {
    case 'drink':
    case 'counter': {
      let goal = nOr(raw['goal'], NaN);
      let step = nOr(raw['step'], NaN);
      let max = nOr(raw['max'], NaN);
      if (!(goal > 0 && step > 0 && max > 0 && max >= goal)) {
        goal = 10;
        step = 1;
        max = 20;
      }
      return { ...base, type, goal, step, max, unit: clipStr(raw['unit'], 8) };
    }
    case 'times':
      return { ...base, type, target: Math.max(1, Math.min(6, Math.floor(nOr(raw['target'], 3)) || 3)) };
    case 'bad': {
      const levels = Array.isArray(raw['levels'])
        ? raw['levels']
            .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
            .map((l) => l.trim().slice(0, 10))
            .slice(0, 8)
        : [];
      return levels.length ? { ...base, type, levels } : { ...base, type };
    }
    case 'good':
    case 'weekly':
      return { ...base, type };
  }
}

function sanitizeLogs(raw: unknown): Record<DateKey, LogValue> {
  const out: Record<DateKey, LogValue> = {};
  if (!isPlainObj(raw)) return out;
  for (const k of Object.keys(raw)) {
    if (!isDateKey(k)) continue;
    const v = raw[k];
    if (v === 'done' || v === 'fail' || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e6)) {
      out[k] = v;
    }
  }
  return out;
}

const clampInt = (v: unknown, fallback: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.floor(nOr(v, fallback))));

function sanitizeProfile(raw: unknown): Profile {
  const a: PlainObject = isPlainObj(raw) ? raw : {};
  const themeMode = isThemeMode(a['themeMode']) ? a['themeMode'] : a['darkMode'] === true ? 'dark' : 'light';
  const lastBackup =
    typeof a['lastBackup'] === 'string' && !Number.isNaN(Date.parse(a['lastBackup'])) ? a['lastBackup'] : undefined;
  return {
    name: clipStr(a['name'], 40),
    avatar: clipStr(a['avatar'], 16),
    soundEnabled: a['soundEnabled'] !== false,
    notifsEnabled: !!a['notifsEnabled'],
    zenMode: !!a['zenMode'],
    darkMode: !!a['darkMode'],
    themeMode,
    pauseQuota: clampInt(a['pauseQuota'], 3, 0, 10),
    dayStartHour: clampInt(a['dayStartHour'], 0, 0, 6),
    weeklyReview: a['weeklyReview'] !== false,
    moodFeelings: mapDates(a['moodFeelings'], (v) => (typeof v === 'string' ? v.slice(0, 200) : undefined)),
    ...(lastBackup ? { lastBackup } : {}),
    ...(isDateKey(a['backupSnooze']) ? { backupSnooze: a['backupSnooze'] } : {}),
    ...(isDateKey(a['reviewedWeek']) ? { reviewedWeek: a['reviewedWeek'] } : {}),
  };
}

function sanitizeReminders(raw: unknown, habitIds: ReadonlySet<string>): Reminder[] {
  const list: readonly unknown[] = Array.isArray(raw) ? raw : DEFAULT_REMINDERS;
  const seen = new Set<string>();
  const out: Reminder[] = [];
  list
    .filter(isPlainObj)
    .slice(0, 50)
    .forEach((e, n) => {
      const id = isSafeId(e['id']) ? e['id'] : `r_imp${n}`;
      if (seen.has(id)) return;
      seen.add(id);
      out.push({
        id,
        title: clipStr(e['title'], 40) || 'Rappel',
        body: clipStr(e['body'], 80),
        hour: clampInt(e['hour'], 9, 0, 23),
        minute: clampInt(e['minute'], 0, 0, 59),
        days: uniqueInts(e['days'], 0, 6),
        habitId: typeof e['habitId'] === 'string' && habitIds.has(e['habitId']) ? e['habitId'] : '',
        enabled: e['enabled'] !== false,
      });
    });
  return out;
}

function sanitizeChallenges(raw: unknown): Challenge[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isPlainObj)
    .filter(
      (e) =>
        isChallengeStatus(e['status']) &&
        isSafeId(e['id']) &&
        typeof e['habitId'] === 'string' &&
        isDateKey(e['start']) &&
        typeof e['days'] === 'number' &&
        Number.isInteger(e['days']) &&
        e['days'] >= 3 &&
        e['days'] <= 365,
    )
    .slice(0, 200)
    .map((e): Challenge => {
      const days = e['days'] as number;
      return {
        id: e['id'] as string,
        habitId: e['habitId'] as string,
        title: clipStr(e['title'], 50) || 'Défi',
        emoji: clipStr(e['emoji'], 8) || '🎯',
        color: isHex(e['color']) ? e['color'] : '#8EA2FF',
        days,
        required: e['required'] === 'all' ? 'all' : Math.max(1, Math.floor(nOr(e['required'], days))),
        start: e['start'] as DateKey,
        status: e['status'] as Challenge['status'],
        reward: Math.max(0, Math.floor(nOr(e['reward'], 0))),
        ...(isDateKey(e['endedOn']) ? { endedOn: e['endedOn'] } : {}),
      };
    });
}

/**
 * Valide et nettoie une base importée (sauvegarde JSON ou ancien `localStorage`).
 * Port fidèle de `normalizeImported()` de `backup.js` : rien n'est conservé sans
 * avoir été vérifié (types, bornes, clés de date, identifiants).
 */
export function normalizeImported(input: unknown, todayKey: DateKey): ImportResult {
  if (!isPlainObj(input)) return { ok: false, error: 'Format non reconnu.' };
  const rawHabits = input['habits'];
  if (!isPlainObj(rawHabits)) return { ok: false, error: 'Ce fichier ne ressemble pas à une sauvegarde Zeno.' };

  // Sans `habitDefs`, la PWA reprend les habitudes par défaut telles quelles (déjà valides).
  const candidates: readonly Habit[] = Array.isArray(input['habitDefs'])
    ? input['habitDefs'].map(sanitizeHabitDef).filter((h): h is Habit => h !== null)
    : DEFAULT_HABITS;
  const seenHabits = new Set<string>();
  const habitDefs: Habit[] = [];
  for (const h of candidates) {
    if (seenHabits.has(h.id)) continue;
    seenHabits.add(h.id);
    habitDefs.push(h);
  }
  habitDefs.splice(100);

  const habits: Record<string, HabitLog> = {};
  for (const h of habitDefs) {
    const entry = rawHabits[h.id];
    const e: PlainObject = isPlainObj(entry) ? entry : {};
    const logs = sanitizeLogs(e['logs']);
    const vals = isPlainObj(e['vals'])
      ? mapDates(e['vals'], (v) => (typeof v === 'string' ? v.slice(0, 10) : undefined))
      : {};
    habits[h.id] = Object.keys(vals).length ? { logs, vals } : { logs };
  }

  const seasonXp: Record<string, number> = {};
  const rawSeason = input['seasonXp'];
  if (isPlainObj(rawSeason)) {
    for (const k of Object.keys(rawSeason)) {
      const v = rawSeason[k];
      if (/^(winter|spring|summer|autumn)-\d{4}$/.test(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        seasonXp[k] = Math.floor(v);
      }
    }
  }

  const dateList = (v: unknown): DateKey[] => (Array.isArray(v) ? v.filter(isDateKey) : []);

  const db: Db = {
    createdAt: isDateKey(input['createdAt']) ? input['createdAt'] : todayKey,
    xp: Math.max(0, Math.floor(nOr(input['xp'], 0))),
    profile: sanitizeProfile(input['profile']),
    habitDefs,
    habits,
    moods: mapDates<MoodValue>(input['moods'], (v) =>
      typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5 ? (v as MoodValue) : undefined,
    ),
    journal: mapDates(input['journal'], (v) => (typeof v === 'string' && v.trim() ? v.slice(0, 600) : undefined)),
    pauses: mapDates<Pause>(input['pauses'], (v) => ({
      reason: isPlainObj(v) && isPauseReason(v['reason']) ? v['reason'] : 'other',
    })),
    xpWeek: mapDates(input['xpWeek'], (v) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e7 ? Math.floor(v) : undefined,
    ),
    meditation: mapDates(input['meditation'], (v) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1440 ? v : undefined,
    ),
    sleepLog: mapDates<SleepEntry>(input['sleepLog'], (v) =>
      isPlainObj(v) && typeof v['hours'] === 'number' && Number.isFinite(v['hours'])
        ? {
            hours: Math.min(24, Math.max(0, v['hours'])),
            minutes: Math.min(59, Math.max(0, nOr(v['minutes'], 0))),
            bedtime: clipStr(v['bedtime'], 5),
            wakeTime: clipStr(v['wakeTime'], 5),
          }
        : undefined,
    ),
    reminders: sanitizeReminders(input['reminders'], seenHabits),
    challenges: sanitizeChallenges(input['challenges']),
    seasonXp,
    unlockedAchievements: (Array.isArray(input['unlockedAchievements']) ? input['unlockedAchievements'] : []).filter(
      (id): id is string => typeof id === 'string' && ACHIEVEMENT_IDS.has(id),
    ),
    perfectDaysClaimed: dateList(input['perfectDaysClaimed']),
    penaltiesApplied: dateList(input['penaltiesApplied']),
    ...(isDateKey(input['meditationXpDay']) ? { meditationXpDay: input['meditationXpDay'] } : {}),
  };
  return { ok: true, db };
}

export interface BackupMeta {
  readonly app?: string;
  readonly schema?: string;
  readonly appVersion?: string;
  readonly exportedAt?: string;
}

export type BackupParseResult =
  | { readonly ok: true; readonly db: Db; readonly meta: BackupMeta }
  | { readonly ok: false; readonly error: string };

/**
 * Lit le texte d'un fichier de sauvegarde. Accepte l'enveloppe
 * `{ app, schema, appVersion, exportedAt, data }` de la PWA ou une base « nue ».
 */
export function parseBackup(text: string, todayKey: DateKey): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Fichier illisible : ce n’est pas du JSON valide' };
  }
  const payload = isPlainObj(parsed) && isPlainObj(parsed['data']) ? parsed['data'] : parsed;
  const result = normalizeImported(payload, todayKey);
  if (!result.ok) return result;
  const env: PlainObject = isPlainObj(parsed) ? parsed : {};
  const meta: BackupMeta = {
    ...(typeof env['app'] === 'string' ? { app: env['app'] } : {}),
    ...(typeof env['schema'] === 'string' ? { schema: env['schema'] } : {}),
    ...(typeof env['appVersion'] === 'string' ? { appVersion: env['appVersion'] } : {}),
    ...(typeof env['exportedAt'] === 'string' ? { exportedAt: env['exportedAt'] } : {}),
  };
  return { ok: true, db: result.db, meta };
}

/** Enveloppe d'export (même format que la PWA, donc réimportable des deux côtés). */
export function buildBackup(db: Db, appVersion: string, now: Date): PlainObject {
  return { app: 'Zeno', schema: LEGACY_SCHEMA, appVersion, exportedAt: now.toISOString(), data: db };
}
