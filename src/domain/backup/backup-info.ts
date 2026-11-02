import { addDays, fmtDate, parseDate } from '../date/calendar';
import { appNow, type Ctx } from '../date/clock';
import { Tx } from '../actions/tx';
import { fmtDay, fmtNum } from '../format';
import { calcLevel } from '../gamification/levels';
import type { Db } from '../types/db';

export const BACKUP_STALE_DAYS = 14;
/** Taille maximale d'un fichier de sauvegarde importé (15 Mo). */
export const IMPORT_MAX_BYTES = 15 * 1024 * 1024;

/** Jours entiers écoulés depuis une date ISO (`null` si la date est illisible). */
export function daysSince(ctx: Ctx, iso: string | Date): number | null {
  const today = new Date(ctx.clock.now());
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  then.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then.getTime()) / 864e5);
}

export const agoLabel = (days: number): string =>
  days <= 0 ? 'aujourd’hui' : days === 1 ? 'hier' : days < 31 ? `il y a ${days} jours` : `il y a ${Math.floor(days / 30)} mois`;

export function lastBackupLabel(ctx: Ctx): string {
  const d = ctx.db.profile.lastBackup ? daysSince(ctx, ctx.db.profile.lastBackup) : null;
  return d == null ? 'Jamais sauvegardé' : `Dernière sauvegarde : ${agoLabel(d)}`;
}

/** Sauvegarde ancienne (14 jours) ou, sans sauvegarde, application utilisée depuis 7 jours. */
export function backupStale(ctx: Ctx): boolean {
  const n = ctx.db.profile.lastBackup ? daysSince(ctx, ctx.db.profile.lastBackup) : null;
  if (n != null) return n >= BACKUP_STALE_DAYS;
  const a = daysSince(ctx, parseDate(ctx.db.createdAt));
  return a != null && a >= 7;
}

export type BackupNudge = { readonly show: false } | { readonly show: true; readonly text: string };

export function backupNudge(ctx: Ctx): BackupNudge {
  const snooze = ctx.db.profile.backupSnooze;
  const key = fmtDate(appNow(ctx));
  if (!backupStale(ctx) || (snooze && snooze > key)) return { show: false };
  const d = ctx.db.profile.lastBackup ? daysSince(ctx, ctx.db.profile.lastBackup) : null;
  return { show: true, text: d == null ? 'Tes données ne sont pas sauvegardées' : `Dernière sauvegarde ${agoLabel(d)}` };
}

/** « Me le rappeler dans 7 jours ». */
export function snoozeBackupNudge(ctx: Ctx): Db {
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ profile: { ...ctx.db.profile, backupSnooze: fmtDate(addDays(appNow(ctx), 7)) } });
  return tx.db;
}

/** Texte de confirmation avant d'écraser les données (puces « • »). */
export function importSummaryText(db: Db, exportedAt?: string | null): string {
  const active = db.habitDefs.filter((h) => !h.archived).length;
  const archived = db.habitDefs.length - active;
  const moods = Object.keys(db.moods).length;
  const notes = Object.keys(db.journal).length;
  const lines = [
    `• ${active} habitude${active > 1 ? 's' : ''}${archived ? ` (+ ${archived} archivée${archived > 1 ? 's' : ''})` : ''}`,
    `• ${fmtNum(db.xp)} XP · niveau ${calcLevel(db.xp)}`,
    `• ${moods} humeur${moods > 1 ? 's' : ''}, ${notes} note${notes > 1 ? 's' : ''}`,
    `• utilisée depuis le ${fmtDay(db.createdAt)} ${db.createdAt.slice(0, 4)}`,
  ];
  if (typeof exportedAt === 'string' && !Number.isNaN(Date.parse(exportedAt))) {
    lines.unshift(`Sauvegarde du ${new Date(exportedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  }
  return lines.join('\n');
}

/** « 14 octobre » : date d'un point de restauration. */
export const restorePointLabel = (iso: string | null): string =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
