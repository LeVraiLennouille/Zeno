import { LEVEL_NAMES, XP } from '../constants/gamification';
import { getWeekMonday } from '../date/calendar';
import { appNow, today, type Clock, type Ctx } from '../date/clock';
import { seasonOf, seasonRank } from '../challenges/season';
import { ACHIEVEMENTS } from '../gamification/achievements';
import { countDoneToday, requiredToday } from '../gamification/daily';
import { calcLevel } from '../gamification/levels';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';
import type { ActionResult, DomainEvent } from '../types/events';
import type { HabitLog, LogValue } from '../types/habit';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** XP hebdomadaire conservée : 20 semaines. */
const XP_WEEK_KEPT = 20;

/**
 * Transaction : accumule les modifications d'une action sur une copie de la base
 * (copie-sur-écriture, jamais de mutation de l'original) et les événements émis.
 * C'est l'équivalent pur de la séquence `DB.x = …; giveXP(); playSound(); saveData()`
 * de la PWA.
 */
export class Tx {
  private d: Mutable<Db>;
  private readonly evts: DomainEvent[] = [];

  constructor(db: Db, readonly clock: Clock) {
    this.d = { ...db };
  }

  get db(): Db {
    return this.d;
  }

  get ctx(): Ctx {
    return { db: this.d, clock: this.clock };
  }

  emit(e: DomainEvent): void {
    this.evts.push(e);
  }

  result(): ActionResult {
    return { db: this.d, events: this.evts };
  }

  /** Remplace des champs de premier niveau. */
  patch(partial: Partial<Mutable<Db>>): void {
    this.d = { ...this.d, ...partial };
  }

  /** Écrit (ou efface si `undefined`) la valeur d'une habitude pour un jour. */
  setLog(habitId: string, key: DateKey, value: LogValue | undefined): void {
    const cur = this.d.habits[habitId];
    if (!cur) return;
    const logs: Record<DateKey, LogValue> = { ...cur.logs };
    if (value === undefined) delete logs[key];
    else logs[key] = value;
    this.d.habits = { ...this.d.habits, [habitId]: { ...cur, logs } };
  }

  /** Écrit (ou efface) le palier d'un échec « à éviter ». Supprime `vals` s'il devient vide. */
  setVal(habitId: string, key: DateKey, value: string | undefined): void {
    const cur = this.d.habits[habitId];
    if (!cur) return;
    const vals: Record<DateKey, string> = { ...(cur.vals ?? {}) };
    if (value === undefined) delete vals[key];
    else vals[key] = value;
    const next: HabitLog =
      Object.keys(vals).length > 0 ? { logs: cur.logs, vals } : { logs: cur.logs };
    this.d.habits = { ...this.d.habits, [habitId]: next };
  }

  private addSeasonXp(amount: number): void {
    if (!(amount > 0)) return;
    const id = seasonOf(appNow(this.ctx)).id;
    const before = this.d.seasonXp[id] ?? 0;
    const beforeRank = seasonRank(before).rank;
    this.d.seasonXp = { ...this.d.seasonXp, [id]: before + amount };
    const after = seasonRank(before + amount);
    if (after.rank > beforeRank) {
      this.emit({ type: 'season_rank_up', roman: after.roman, name: after.name });
    }
  }

  private addWeekXp(amount: number): void {
    if (!(amount > 0)) return;
    const monday = getWeekMonday(appNow(this.ctx));
    const next: Record<DateKey, number> = {
      ...this.d.xpWeek,
      [monday]: (this.d.xpWeek[monday] ?? 0) + amount,
    };
    const keys = (Object.keys(next) as DateKey[]).sort();
    while (keys.length > XP_WEEK_KEPT) {
      const oldest = keys.shift();
      if (oldest !== undefined) delete next[oldest];
    }
    this.d.xpWeek = next;
  }

  giveXP(amount: number): void {
    const before = calcLevel(this.d.xp);
    this.d.xp = (this.d.xp || 0) + amount;
    this.emit({ type: 'xp_gained', amount });
    this.addSeasonXp(amount);
    this.addWeekXp(amount);
    const after = calcLevel(this.d.xp);
    if (after > before) {
      this.emit({
        type: 'level_up',
        level: after,
        name: LEVEL_NAMES[after - 1] ?? `Niveau ${after}`,
      });
    }
  }

  checkAchievements(): void {
    let order = 0;
    for (const a of ACHIEVEMENTS) {
      if (this.d.unlockedAchievements.includes(a.id) || !a.check(this.ctx)) continue;
      this.d.unlockedAchievements = [...this.d.unlockedAchievements, a.id];
      order++;
      this.emit({ type: 'achievement_unlocked', id: a.id, name: a.name, order });
    }
  }

  /** Toutes les habitudes obligatoires du jour sont faites : confettis, et bonus la première fois. */
  checkPerfectNow(): void {
    const required = requiredToday(this.ctx);
    if (required === 0 || countDoneToday(this.ctx) !== required) return;
    const key = today(this.ctx);
    const first = !this.d.perfectDaysClaimed.includes(key);
    this.emit({ type: 'perfect_day', bonusXp: first ? XP.perfectDay : null });
    if (first) {
      this.d.perfectDaysClaimed = [...this.d.perfectDaysClaimed, key];
      this.giveXP(XP.perfectDay);
    }
  }

  afterToggle(habitId: string): void {
    this.checkPerfectNow();
    this.emit({ type: 'habit_flash', habitId });
  }
}

export const noop = (ctx: Ctx): ActionResult => ({ db: ctx.db, events: [] });
