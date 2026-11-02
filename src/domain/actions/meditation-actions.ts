import { XP } from '../constants/gamification';
import { today, type Ctx } from '../date/clock';
import type { ActionResult } from '../types/events';
import { noop, Tx } from './tx';

/** Ajoute des minutes au total du jour (arrondi au dixième, comme la PWA). */
function logMinutes(tx: Tx, minutes: number): void {
  const key = today(tx.ctx);
  const total = Math.round(((tx.db.meditation[key] ?? 0) + minutes) * 10) / 10;
  tx.patch({ meditation: { ...tx.db.meditation, [key]: total } });
}

/** Séance menée à terme : minutes, +10 XP la première fois du jour, succès. */
export function completeMeditation(ctx: Ctx, minutes: number): ActionResult {
  const tx = new Tx(ctx.db, ctx.clock);
  logMinutes(tx, minutes);
  const key = today(ctx);
  const first = tx.db.meditationXpDay !== key;
  if (first) {
    tx.patch({ meditationXpDay: key });
    tx.giveXP(XP.meditation);
  }
  tx.emit({ type: 'meditation_done', minutes, xp: first ? XP.meditation : null });
  tx.checkAchievements();
  return tx.result();
}

/** Séance interrompue : seules les minutes entières déjà faites sont comptées (sans XP). */
export function stopMeditationSession(ctx: Ctx, elapsedSeconds: number): ActionResult {
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 1) return noop(ctx);
  const tx = new Tx(ctx.db, ctx.clock);
  logMinutes(tx, minutes);
  tx.checkAchievements();
  return tx.result();
}

export const meditationToday = (ctx: Ctx): number => Math.round(ctx.db.meditation[today(ctx)] ?? 0);
