import * as D from '../domain';
import type { ActionResult, Clock, Ctx, Db, DomainEvent, Result, DateKey } from '../domain';
import { eventsToFeedback, type FeedbackItem } from './feedback';
import {
  deserializeDb,
  serializeDb,
  STORAGE_KEYS,
  type LegacySource,
} from './persistence';
import type { StorageAdapter } from './storage';

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface StoreDeps {
  readonly storage: StorageAdapter;
  readonly clock: D.Clock;
  /** Générateur d'identifiants (habitudes, défis, rappels). */
  readonly newId: (prefix: string) => string;
  readonly appVersion: string;
  /** Ancien `localStorage` de la PWA (web) : repris une seule fois au premier lancement. */
  readonly legacy?: LegacySource;
  readonly saveDelayMs?: number;
  /** Minuteries (injectées : `setTimeout` en production, faux temps dans les tests). */
  readonly timers: Timers;
}

export type LoadIssue = 'none' | 'corrupt' | 'legacy_imported';

export interface AppState {
  readonly db: Db;
  readonly hydrated: boolean;
  /** Incrémenté quand le temps passe sans que la base change (minuit, retour au premier plan). */
  readonly revision: number;
  readonly loadIssue: LoadIssue;
  readonly saveFailed: boolean;
}

export type ImportOutcome =
  | { readonly ok: true; readonly summary: ImportSummary }
  | { readonly ok: false; readonly error: string };

export interface ImportSummary {
  readonly habits: number;
  readonly loggedDays: number;
  readonly xp: number;
  readonly level: number;
  readonly exportedAt: string | null;
  readonly schema: string | null;
}

export function summarize(db: Db, meta: { exportedAt?: string; schema?: string } = {}): ImportSummary {
  const days = new Set<string>();
  for (const h of Object.values(db.habits)) for (const k of Object.keys(h.logs)) days.add(k);
  return {
    habits: db.habitDefs.length,
    loggedDays: days.size,
    xp: db.xp,
    level: D.calcLevel(db.xp),
    exportedAt: meta.exportedAt ?? null,
    schema: meta.schema ?? null,
  };
}

/**
 * Source de vérité de l'application. Chaque méthode appelle une action pure du
 * domaine, enregistre le résultat, puis transmet les retours sensoriels (toasts,
 * sons…) aux abonnés. Aucune dépendance à React ni à Expo : testable sous Node.
 */
export class AppStore {
  private state: AppState;
  private readonly listeners = new Set<() => void>();
  private readonly feedbackListeners = new Set<(items: FeedbackItem[]) => void>();
  private readonly timers: Timers;
  private saveHandle: unknown = null;
  private dirty = false;
  private writing: Promise<void> = Promise.resolve();

  constructor(private readonly deps: StoreDeps) {
    this.timers = deps.timers;
    this.state = {
      db: D.createInitialDb(D.fmtDate(deps.clock.now())),
      hydrated: false,
      revision: 0,
      loadIssue: 'none',
      saveFailed: false,
    };
  }

  // ───────────── Lecture / abonnement (compatible useSyncExternalStore) ─────────────

  getState = (): AppState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeFeedback = (listener: (items: FeedbackItem[]) => void): (() => void) => {
    this.feedbackListeners.add(listener);
    return () => this.feedbackListeners.delete(listener);
  };

  get clock(): D.Clock {
    return this.deps.clock;
  }

  get ctx(): Ctx {
    return { db: this.state.db, clock: this.deps.clock };
  }

  private set(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  // ───────────── Cycle de vie ─────────────

  /** Charge la base : stockage → ancien localStorage (une fois) → base neuve. */
  async hydrate(): Promise<void> {
    if (this.state.hydrated) return;
    const { storage } = this.deps;
    const todayKey = D.fmtDate(this.deps.clock.now());
    let db = this.state.db;
    let issue: LoadIssue = 'none';
    let mustSave = false;

    const raw = await storage.getItem(STORAGE_KEYS.db);
    if (raw !== null) {
      const r = deserializeDb(raw, todayKey);
      if (r.ok) db = r.db;
      else {
        await storage.setItem(STORAGE_KEYS.corrupt, raw);
        issue = 'corrupt';
        mustSave = true;
      }
    } else if ((await storage.getItem(STORAGE_KEYS.legacyImported)) === null) {
      const text = this.deps.legacy?.() ?? null;
      if (text) {
        const r = D.parseBackup(text, todayKey);
        if (r.ok) {
          db = r.db;
          issue = 'legacy_imported';
          mustSave = true;
          await storage.setItem(STORAGE_KEYS.legacyImported, '1');
        }
      }
    }

    this.state = { ...this.state, db, hydrated: true, loadIssue: issue };
    this.syncChallenges();
    for (const l of this.listeners) l();
    if (mustSave) {
      this.dirty = true;
      await this.flush();
    }
  }

  /** Le temps a passé (minuit, retour au premier plan) : recalcule défis et vues. */
  refresh(): void {
    if (!this.state.hydrated) return;
    this.apply(this.state.db, []);
    this.set({ revision: this.state.revision + 1 });
  }

  // ───────────── Écriture ─────────────

  private apply(db: Db, events: readonly DomainEvent[]): void {
    let current = db;
    const all = [...events];
    const challenges = D.updateChallenges({ db: current, clock: this.deps.clock });
    if (challenges.db !== current) {
      current = challenges.db;
      all.push(...challenges.events);
    }
    if (current !== this.state.db) {
      this.set({ db: current });
      this.scheduleSave();
    }
    if (all.length > 0) {
      const items = eventsToFeedback(all);
      for (const l of this.feedbackListeners) l(items);
    }
  }

  private syncChallenges(): void {
    const r = D.updateChallenges(this.ctx);
    if (r.db !== this.state.db) {
      this.state = { ...this.state, db: r.db };
      this.dirty = true;
      const items = eventsToFeedback(r.events);
      for (const l of this.feedbackListeners) l(items);
    }
  }

  private run(fn: (ctx: Ctx) => ActionResult): void {
    if (!this.state.hydrated) return;
    const r = fn(this.ctx);
    this.apply(r.db, r.events);
  }

  private edit(fn: (ctx: Ctx) => Db): void {
    if (!this.state.hydrated) return;
    this.apply(fn(this.ctx), []);
  }

  private scheduleSave(): void {
    if (!this.state.hydrated) return;
    this.dirty = true;
    if (this.saveHandle !== null) this.timers.clear(this.saveHandle);
    this.saveHandle = this.timers.set(() => {
      this.saveHandle = null;
      void this.flush();
    }, this.deps.saveDelayMs ?? 300);
  }

  /** Écrit immédiatement les modifications en attente (à appeler en passant en arrière-plan). */
  flush(): Promise<void> {
    if (this.saveHandle !== null) {
      this.timers.clear(this.saveHandle);
      this.saveHandle = null;
    }
    this.writing = this.writing.then(async () => {
      if (!this.dirty) return;
      this.dirty = false;
      try {
        await this.deps.storage.setItem(STORAGE_KEYS.db, serializeDb(this.state.db, this.deps.clock.now()));
        if (this.state.saveFailed) this.set({ saveFailed: false });
      } catch {
        this.dirty = true;
        if (!this.state.saveFailed) this.set({ saveFailed: true });
      }
    });
    return this.writing;
  }

  // ───────────── Habitudes ─────────────

  toggleHabit = (id: string): void => this.run((c) => D.toggleHabit(c, id));
  addDrink = (amount: number): void => this.run((c) => D.addDrinkAmount(c, amount));
  removeDrink = (): void => this.run((c) => D.removeDrink(c));
  addCounter = (id: string): void => this.run((c) => D.addCounter(c, id));
  removeCounter = (id: string): void => this.run((c) => D.removeCounter(c, id));
  setBadLevel = (id: string, level: number): void => this.run((c) => D.setBadLevel(c, id, level));
  toggleHabitOnDate = (id: string, date: DateKey): void => this.edit((c) => D.toggleHabitOnDate(c, id, date));
  moveHabit = (id: string, delta: number): boolean => {
    const next = D.moveHabit(this.state.db, id, delta);
    if (!next) return false;
    this.edit(() => next);
    return true;
  };
  applyHabitOrder = (ids: readonly string[]): boolean => {
    const next = D.applyHabitOrder(this.state.db, ids);
    if (!next) return false;
    this.edit(() => next);
    return true;
  };

  saveHabit(form: D.HabitForm): Result<D.HabitSaved, D.HabitFormError> {
    const r = D.saveHabit(this.ctx, form, () => this.deps.newId('c'));
    if (r.ok) this.edit(() => r.value.db);
    return r;
  }

  archiveHabit(id: string): D.ArchiveUndo | null {
    const r = D.archiveHabit(this.ctx, id);
    if (!r) return null;
    this.edit(() => r.db);
    return r.undo;
  }

  restoreHabit(id: string, opts?: Parameters<typeof D.restoreHabit>[2]): boolean {
    const db = D.restoreHabit(this.ctx, id, opts);
    if (!db) return false;
    this.edit(() => db);
    return true;
  }

  purgeHabit(id: string): D.PurgeUndo | null {
    const r = D.purgeHabit(this.ctx, id);
    if (!r) return null;
    this.edit(() => r.db);
    return r.undo;
  }

  undoPurge(undo: D.PurgeUndo): void {
    this.edit((c) => D.undoPurge(c.db, undo));
  }

  // ───────────── Défis et pauses ─────────────

  createChallenge(input: D.ChallengeInput): Result<true, D.ChallengeError> {
    const r = D.createChallenge(this.ctx, input, () => this.deps.newId('ch'));
    if (!r.ok) return r;
    this.apply(r.value.db, r.value.events);
    return { ok: true, value: true };
  }
  abandonChallenge = (id: string): void => this.run((c) => D.abandonChallenge(c, id));
  clearChallengeHistory = (): void => this.run((c) => D.clearChallengeHistory(c));

  savePause(input: D.PauseInput): Result<number, D.PauseError> {
    const r = D.savePause(this.ctx, input);
    if (!r.ok) return r;
    this.apply(r.value.db, r.value.events);
    return { ok: true, value: r.value.days };
  }
  removePause = (date: DateKey): void => this.run((c) => D.removePause(c, date));
  changePauseQuota = (delta: number): void => this.run((c) => D.changePauseQuota(c, delta));

  /** Le bilan de cette semaine a été vu : il ne sera plus proposé automatiquement. */
  markWeekReviewed = (monday: DateKey): void => this.edit((c) => D.markReviewed(c, monday));

  // ───────────── Rappels et sauvegarde ─────────────

  saveReminder(form: D.ReminderForm): Result<{ created: boolean }, D.ReminderError> {
    const r = D.saveReminder(this.ctx, form, () => this.deps.newId('r'));
    if (!r.ok) return r;
    this.edit(() => r.value.db);
    return { ok: true, value: { created: r.value.created } };
  }
  toggleReminder = (id: string): void => this.edit((c) => D.toggleReminder(c, id));
  deleteReminder = (id: string): void => this.edit((c) => D.deleteReminder(c, id));
  snoozeBackupNudge = (): void => this.edit((c) => D.snoozeBackupNudge(c));

  /** Date du point de restauration laissé par le dernier import (`null` = aucun). */
  async restorePointInfo(): Promise<{ readonly at: string | null } | null> {
    const raw = await this.deps.storage.getItem(STORAGE_KEYS.restorePoint);
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      const at = typeof parsed === 'object' && parsed !== null && 'savedAt' in parsed ? (parsed as { savedAt: unknown }).savedAt : null;
      return { at: typeof at === 'string' ? at : null };
    } catch {
      return { at: null };
    }
  }

  // ───────────── Humeur et sommeil ─────────────

  saveMood(input: D.MoodInput): Result<{ hasNote: boolean }, D.MoodError> {
    const r = D.saveMood(this.ctx, input);
    if (!r.ok) return r;
    this.edit(() => r.value.db);
    return { ok: true, value: { hasNote: r.value.hasNote } };
  }
  deleteJournalNote = (date: DateKey): void => this.edit((c) => D.deleteJournalNote(c, date));

  saveSleep(input: D.SleepInput): Result<{ hours: number; minutes: number }, D.SleepError> {
    const r = D.saveSleep(this.ctx, input);
    if (!r.ok) return r;
    this.edit(() => r.value.db);
    return { ok: true, value: { hours: r.value.hours, minutes: r.value.minutes } };
  }

  completeMeditation = (minutes: number): void => this.run((c) => D.completeMeditation(c, minutes));
  stopMeditation = (elapsedSeconds: number): void => this.run((c) => D.stopMeditationSession(c, elapsedSeconds));

  // ───────────── Profil et réglages ─────────────

  setName = (name: string): void => this.edit((c) => D.setProfileName(c.db, c.clock, name));
  togglePref = (pref: D.ToggleablePref): void => this.edit((c) => D.togglePref(c.db, c.clock, pref));
  setThemeMode = (mode: D.ThemeMode): void => this.edit((c) => D.setThemeMode(c.db, c.clock, mode));
  setAvatar = (value: string | null): void => this.edit((c) => D.setAvatar(c.db, c.clock, value));
  setDayStartHour(hour: number): void {
    this.edit((c) => D.setDayStartHour(c.db, c.clock, hour));
    this.set({ revision: this.state.revision + 1 });
  }

  // ───────────── Sauvegarde ─────────────

  /** Texte JSON à partager ; note la date de dernière sauvegarde. */
  exportBackup(): string {
    const now = this.deps.clock.now();
    this.edit((c) => ({ ...c.db, profile: { ...c.db.profile, lastBackup: now.toISOString() } }));
    return JSON.stringify(D.buildBackup(this.state.db, this.deps.appVersion, now), null, 2);
  }

  /** Remplace toutes les données ; l'ancienne base reste récupérable (« Annuler l'import »). */
  async importBackup(text: string): Promise<ImportOutcome> {
    const r = D.parseBackup(text, D.fmtDate(this.deps.clock.now()));
    if (!r.ok) return r;
    await this.flush();
    await this.deps.storage.setItem(STORAGE_KEYS.restorePoint, serializeDb(this.state.db, this.deps.clock.now()));
    this.apply(r.db, []);
    this.set({ revision: this.state.revision + 1 });
    await this.flush();
    return { ok: true, summary: summarize(r.db, r.meta) };
  }

  async hasRestorePoint(): Promise<boolean> {
    return (await this.deps.storage.getItem(STORAGE_KEYS.restorePoint)) !== null;
  }

  async restorePreviousImport(): Promise<boolean> {
    const raw = await this.deps.storage.getItem(STORAGE_KEYS.restorePoint);
    if (raw === null) return false;
    const r = deserializeDb(raw, D.fmtDate(this.deps.clock.now()));
    if (!r.ok) return false;
    this.apply(r.db, []);
    this.set({ revision: this.state.revision + 1 });
    await this.deps.storage.removeItem(STORAGE_KEYS.restorePoint);
    await this.flush();
    return true;
  }

  /** Efface tout (zone de danger). Le legacy n'est pas réimporté ensuite. */
  async resetAll(): Promise<void> {
    if (this.saveHandle !== null) this.timers.clear(this.saveHandle);
    this.saveHandle = null;
    this.dirty = false;
    await this.writing;
    const { storage } = this.deps;
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.db),
      storage.removeItem(STORAGE_KEYS.corrupt),
      storage.removeItem(STORAGE_KEYS.restorePoint),
    ]);
    await storage.setItem(STORAGE_KEYS.legacyImported, '1');
    this.set({
      db: D.createInitialDb(D.fmtDate(this.deps.clock.now())),
      revision: this.state.revision + 1,
      loadIssue: 'none',
    });
    this.scheduleSave();
    await this.flush();
  }
}

export type { Clock };
