import { CHAL_MAX_ACTIVE, CHAL_MAX_DAYS, CHAL_MIN_DAYS } from '../constants/seasons';
import { today, type Ctx } from '../date/clock';
import {
  chalActiveDays,
  chalRewardFor,
  chalTitle,
  evalChallenge,
} from '../challenges/challenge';
import { findHabit } from '../habits/activity';
import type { Challenge } from '../types/db';
import type { ActionResult, Result } from '../types/events';
import { noop, Tx } from './tx';

export interface ChallengeInput {
  readonly habitId: string;
  readonly days: number;
  /** Ignoré pour les habitudes « à éviter » (toujours `all`). */
  readonly mode: 'all' | 'min';
  readonly min: number;
  /** Titre libre ; vide = titre automatique. */
  readonly title?: string;
}

export type ChallengeError =
  | 'unknown_habit'
  | 'max_active'
  | 'already_active'
  | 'bad_duration'
  | 'no_active_days';

/**
 * Évalue les défis en cours : gagné (XP versée), manqué, annulé (habitude archivée
 * ou supprimée). À appeler au retour au premier plan et après chaque action.
 */
function runUpdate(tx: Tx): boolean {
  let changed = false;
  const next: Challenge[] = [];
  for (const ch of tx.db.challenges) {
    if (ch.status !== 'active') {
      next.push(ch);
      continue;
    }
    const habit = findHabit(tx.db, ch.habitId);
    const endedOn = today(tx.ctx);
    if (!habit || habit.archived) {
      next.push({ ...ch, status: 'abandoned', endedOn });
      changed = true;
      continue;
    }
    const ev = evalChallenge(tx.ctx, ch, habit);
    if (ev.state === 'active') {
      next.push(ch);
      continue;
    }
    next.push({ ...ch, status: ev.state, endedOn });
    changed = true;
    if (ev.state === 'won') {
      tx.giveXP(ch.reward);
      tx.emit({ type: 'challenge_won', id: ch.id, title: ch.title, reward: ch.reward });
    } else if (ev.state === 'failed') {
      tx.emit({ type: 'challenge_failed', id: ch.id, title: ch.title });
    }
  }
  if (changed) {
    tx.patch({ challenges: next });
    tx.checkAchievements();
  }
  return changed;
}

export function updateChallenges(ctx: Ctx): ActionResult {
  const tx = new Tx(ctx.db, ctx.clock);
  return runUpdate(tx) ? tx.result() : noop(ctx);
}

export function createChallenge(
  ctx: Ctx,
  input: ChallengeInput,
  newId: () => string,
): Result<ActionResult, ChallengeError> {
  const { db } = ctx;
  const habit = findHabit(db, input.habitId);
  if (!habit) return { ok: false, error: 'unknown_habit' };
  const active = db.challenges.filter((c) => c.status === 'active');
  if (active.length >= CHAL_MAX_ACTIVE) return { ok: false, error: 'max_active' };
  if (active.some((c) => c.habitId === habit.id)) return { ok: false, error: 'already_active' };
  const { days } = input;
  if (!(days >= CHAL_MIN_DAYS && days <= CHAL_MAX_DAYS)) return { ok: false, error: 'bad_duration' };

  const mode = habit.type === 'bad' ? 'all' : input.mode;
  const min = Math.min(Math.max(1, Number(input.min) || 1), days);
  const activeDays = chalActiveDays(ctx, habit, days);
  if (activeDays === 0) return { ok: false, error: 'no_active_days' };

  const required: 'all' | number = mode === 'all' ? 'all' : Math.min(min, activeDays);
  const auto = chalTitle(habit, days, input.mode, Math.min(input.min, days));
  const title = ((input.title ?? '').trim() || auto).slice(0, 50);
  const challenge: Challenge = {
    id: newId(),
    habitId: habit.id,
    title,
    emoji: habit.emoji || '🎯',
    color: habit.color,
    days,
    required,
    start: today(ctx),
    status: 'active',
    reward: chalRewardFor(required === 'all' ? activeDays : required),
  };

  const tx = new Tx(db, ctx.clock);
  tx.patch({ challenges: [...db.challenges, challenge] });
  runUpdate(tx);
  return { ok: true, value: tx.result() };
}

export function abandonChallenge(ctx: Ctx, id: string): ActionResult {
  const ch = ctx.db.challenges.find((c) => c.id === id);
  if (!ch || ch.status !== 'active') return noop(ctx);
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({
    challenges: ctx.db.challenges.map((c) =>
      c.id === id ? { ...c, status: 'abandoned', endedOn: today(ctx) } : c,
    ),
  });
  return tx.result();
}

/** Efface l'historique : ne garde que les défis en cours. */
export function clearChallengeHistory(ctx: Ctx): ActionResult {
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ challenges: ctx.db.challenges.filter((c) => c.status === 'active') });
  return tx.result();
}
