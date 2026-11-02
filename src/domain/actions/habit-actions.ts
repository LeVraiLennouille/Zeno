import { XP } from '../constants/gamification';
import { DRINK_ID } from '../constants/habits';
import { today, type Ctx } from '../date/clock';
import { findHabit } from '../habits/activity';
import { timesThisWeek } from '../habits/times';
import { drinkCfg, getCounterVal, getDrinkMl } from '../habits/values';
import type { ActionResult } from '../types/events';
import { noop, Tx } from './tx';

/** Arrondi à 2 décimales, comme l'ancien `Math.round(x * 100) / 100` (pas de 0,5 km, etc.). */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Tap sur une habitude : coche / décoche selon le type. Pour l'eau et les compteurs,
 * un tap ajoute un pas (`addDrinkAmount` / `addCounter`).
 */
export function toggleHabit(ctx: Ctx, habitId: string): ActionResult {
  const habit = findHabit(ctx.db, habitId);
  const log = ctx.db.habits[habitId];
  if (!habit || !log) return noop(ctx);
  if (habit.type === 'drink') return addDrinkAmount(ctx, drinkCfg(ctx.db).step);
  if (habit.type === 'counter') return addCounter(ctx, habitId);

  const tx = new Tx(ctx.db, ctx.clock);
  const key = today(ctx);
  const current = log.logs[key];

  if (habit.type === 'weekly') {
    const check = current !== 'done';
    tx.setLog(habitId, key, check ? 'done' : undefined);
    if (check) tx.giveXP(XP.weekly);
    else tx.emit({ type: 'sound', sound: 'undo' });
    tx.checkAchievements();
    tx.afterToggle(habitId);
    return tx.result();
  }

  if (habit.type === 'bad') {
    if (current === 'fail') {
      tx.setLog(habitId, key, undefined);
      tx.setVal(habitId, key, undefined);
      tx.emit({ type: 'sound', sound: 'undo' });
    } else {
      tx.setLog(habitId, key, 'fail');
      tx.emit({ type: 'sound', sound: 'fail' });
    }
  } else if (current !== 'done') {
    tx.setLog(habitId, key, 'done');
    tx.giveXP(XP.good);
    tx.emit({ type: 'sound', sound: 'done' });
  } else {
    tx.setLog(habitId, key, undefined);
    tx.emit({ type: 'sound', sound: 'undo' });
  }

  tx.checkAchievements();
  if (habit.type === 'times' && tx.db.habits[habitId]?.logs[key] === 'done') {
    const week = timesThisWeek(tx.ctx, habit);
    if (week.state === 'success' && week.done === week.required) {
      tx.emit({ type: 'sound', sound: 'drink' });
      tx.emit({
        type: 'times_goal_reached',
        habitId,
        habitName: habit.name,
        done: week.done,
        required: week.required,
      });
    }
  }
  tx.afterToggle(habitId);
  return tx.result();
}

/** Ajoute `amount` ml (plafonné au maximum). Récompense la première fois que l'objectif est atteint. */
export function addDrinkAmount(ctx: Ctx, amount: number): ActionResult {
  if (!ctx.db.habits[DRINK_ID]) return noop(ctx);
  const cfg = drinkCfg(ctx.db);
  const key = today(ctx);
  const before = getDrinkMl(ctx.db, key);
  if (before >= cfg.max) return noop(ctx);
  const after = Math.min(cfg.max, before + amount);

  const tx = new Tx(ctx.db, ctx.clock);
  tx.setLog(DRINK_ID, key, after);
  const reached = after >= cfg.goal && before < cfg.goal;
  if (reached) {
    tx.emit({ type: 'sound', sound: 'drink' });
    tx.emit({ type: 'goal_reached', habitId: DRINK_ID, habitName: 'Eau', kind: 'drink', xp: XP.goal });
    tx.giveXP(XP.goal);
  }
  tx.checkAchievements();
  if (reached) tx.checkPerfectNow();
  return tx.result();
}

export function removeDrink(ctx: Ctx): ActionResult {
  if (!ctx.db.habits[DRINK_ID]) return noop(ctx);
  const key = today(ctx);
  const current = getDrinkMl(ctx.db, key);
  if (current <= 0) return noop(ctx);
  const next = Math.max(0, current - drinkCfg(ctx.db).step);
  const tx = new Tx(ctx.db, ctx.clock);
  tx.setLog(DRINK_ID, key, next === 0 ? undefined : next);
  tx.emit({ type: 'sound', sound: 'undo' });
  return tx.result();
}

export function addCounter(ctx: Ctx, habitId: string): ActionResult {
  const habit = findHabit(ctx.db, habitId);
  if (!habit || habit.type !== 'counter' || !ctx.db.habits[habitId]) return noop(ctx);
  const key = today(ctx);
  const before = getCounterVal(ctx.db, habitId, key);
  if (before >= habit.max) return noop(ctx);
  const after = Math.min(habit.max, round2(before + habit.step));

  const tx = new Tx(ctx.db, ctx.clock);
  tx.setLog(habitId, key, after);
  const reached = after >= habit.goal && before < habit.goal;
  if (reached) {
    tx.emit({ type: 'sound', sound: 'done' });
    tx.emit({ type: 'goal_reached', habitId, habitName: habit.name, kind: 'counter', xp: XP.goal });
    tx.giveXP(XP.goal);
  }
  tx.checkAchievements();
  if (reached) tx.checkPerfectNow();
  return tx.result();
}

export function removeCounter(ctx: Ctx, habitId: string): ActionResult {
  const habit = findHabit(ctx.db, habitId);
  if (!habit || habit.type !== 'counter' || !ctx.db.habits[habitId]) return noop(ctx);
  const key = today(ctx);
  const before = getCounterVal(ctx.db, habitId, key);
  if (before <= 0) return noop(ctx);
  const after = Math.max(0, round2(before - habit.step));
  const tx = new Tx(ctx.db, ctx.clock);
  tx.setLog(habitId, key, after === 0 ? undefined : after);
  tx.emit({ type: 'sound', sound: 'undo' });
  tx.checkAchievements();
  return tx.result();
}

/**
 * Choisit le palier d'un écart « à éviter ». `levelIndex` 0 = « Non » (pas d'écart),
 * 1…n = palier n du habit.levels.
 */
export function setBadLevel(ctx: Ctx, habitId: string, levelIndex: number): ActionResult {
  const habit = findHabit(ctx.db, habitId);
  const log = ctx.db.habits[habitId];
  if (!habit || habit.type !== 'bad' || !habit.levels || !log) return noop(ctx);
  const key = today(ctx);
  const wasFail = log.logs[key] === 'fail';
  const tx = new Tx(ctx.db, ctx.clock);

  if (levelIndex === 0) {
    tx.setLog(habitId, key, undefined);
    tx.setVal(habitId, key, undefined);
    if (wasFail) tx.emit({ type: 'sound', sound: 'undo' });
  } else {
    const level = habit.levels[levelIndex - 1];
    if (level === undefined) return noop(ctx);
    tx.setLog(habitId, key, 'fail');
    tx.setVal(habitId, key, level);
    tx.emit({ type: 'sound', sound: 'fail' });
  }
  tx.checkAchievements();
  tx.afterToggle(habitId);
  return tx.result();
}
