import { CHAL_MAX_ACTIVE, ROMAN } from '../constants/seasons';
import { addDays, fmtDate, parseDate } from '../date/calendar';
import { appNow, midnight, today, type Ctx } from '../date/clock';
import { fmtDay, fmtNum } from '../format';
import {
  chalActiveDays,
  chalRewardFor,
  chalTitle,
  evalChallenge,
  wonChallenges,
} from '../challenges/challenge';
import { currentSeasonXp, seasonFromId, seasonOf, seasonRank } from '../challenges/season';
import { liveHabits } from '../habits/activity';
import type { Challenge } from '../types/db';
import type { Habit } from '../types/habit';
import type { DateKey } from '../types/date';

export interface PastSeasonRow {
  readonly emoji: string;
  readonly label: string;
  readonly roman: string;
  readonly rankName: string;
  readonly xp: number;
}

export interface SeasonCardModel {
  readonly emoji: string;
  readonly label: string;
  readonly roman: string;
  readonly rankName: string;
  readonly daysLeft: number;
  readonly pct: number;
  readonly xp: number;
  /** Texte de droite sous la barre. */
  readonly footRight: string;
  readonly past: readonly PastSeasonRow[];
}

export function seasonCardModel(ctx: Ctx): SeasonCardModel {
  const season = seasonOf(appNow(ctx));
  const xp = currentSeasonXp(ctx);
  const rank = seasonRank(xp);
  const past = Object.keys(ctx.db.seasonXp)
    .filter((id) => id !== season.id)
    .sort()
    .reverse()
    .slice(0, 6)
    .map((id): PastSeasonRow => {
      const s = seasonFromId(id);
      const r = seasonRank(ctx.db.seasonXp[id] ?? 0);
      return { emoji: s.def.emoji, label: s.label, roman: r.roman, rankName: r.name, xp: ctx.db.seasonXp[id] ?? 0 };
    });
  return {
    emoji: season.def.emoji,
    label: season.label,
    roman: rank.roman,
    rankName: rank.name,
    daysLeft: Math.max(0, Math.round((season.end.getTime() - midnight(ctx).getTime()) / 864e5)),
    pct: rank.pct,
    xp,
    footRight: rank.next ? `encore ${fmtNum(rank.needed)} pour le rang ${ROMAN[rank.index + 1]}` : 'Rang maximal !',
    past,
  };
}

export interface ChallengeCardModel {
  readonly id: string;
  readonly emoji: string;
  readonly title: string;
  readonly color: string;
  readonly sub: string;
  readonly pct: number;
  readonly success: number;
  readonly required: number;
  readonly reward: number;
}

export interface ChallengeHistoryRow {
  readonly id: string;
  readonly emoji: string;
  readonly title: string;
  readonly glyph: '✓' | '✗' | '–';
  readonly tone: 'ok' | 'ko' | 'na';
  readonly sub: string;
}

const HISTORY_LABELS: Readonly<Record<string, { glyph: '✓' | '✗' | '–'; label: string; tone: 'ok' | 'ko' | 'na' }>> = {
  won: { glyph: '✓', label: 'Relevé', tone: 'ok' },
  failed: { glyph: '✗', label: 'Manqué', tone: 'ko' },
  abandoned: { glyph: '–', label: 'Abandonné', tone: 'na' },
  void: { glyph: '–', label: 'Annulé', tone: 'na' },
};

export interface ChallengesModel {
  readonly season: SeasonCardModel;
  readonly active: readonly ChallengeCardModel[];
  readonly history: readonly ChallengeHistoryRow[];
  readonly wonCount: number;
  readonly atMax: boolean;
}

export function challengesModel(ctx: Ctx): ChallengesModel {
  const { db } = ctx;
  const active: ChallengeCardModel[] = [];
  for (const ch of db.challenges.filter((c) => c.status === 'active')) {
    const habit = db.habitDefs.find((h) => h.id === ch.habitId);
    if (!habit) continue;
    const ev = evalChallenge(ctx, ch, habit);
    const end: DateKey = fmtDate(addDays(parseDate(ch.start), ch.days - 1));
    active.push({
      id: ch.id,
      emoji: ch.emoji || '🎯',
      title: ch.title,
      color: ch.color || habit.color,
      sub: ev.daysLeft === 0 ? `Dernier jour · fin le ${fmtDay(end)}` : `Jour ${ev.dayNo} / ${ch.days} · fin le ${fmtDay(end)}`,
      pct: ev.required > 0 ? Math.min(100, Math.round((ev.success / ev.required) * 100)) : 0,
      success: ev.success,
      required: ev.required,
      reward: ch.reward,
    });
  }
  const history = db.challenges
    .filter((c) => c.status !== 'active')
    .sort((a, b) => (b.endedOn ?? '').localeCompare(a.endedOn ?? ''))
    .slice(0, 8)
    .map((c): ChallengeHistoryRow => {
      const s = HISTORY_LABELS[c.status] ?? { glyph: '–' as const, label: '', tone: 'na' as const };
      return {
        id: c.id,
        emoji: c.emoji || '🎯',
        title: c.title,
        glyph: s.glyph,
        tone: s.tone,
        sub: `${s.label} · ${fmtDay(c.start)} → ${fmtDay(c.endedOn ?? c.start)}${c.status === 'won' ? ` · +${c.reward} XP` : ''}`,
      };
    });
  return {
    season: seasonCardModel(ctx),
    active,
    history,
    wonCount: wonChallenges(db.challenges).length,
    atMax: db.challenges.filter((c) => c.status === 'active').length >= CHAL_MAX_ACTIVE,
  };
}

// ─────────────── Formulaire de défi ───────────────

export interface ChallengeFormState {
  readonly habitId: string;
  readonly days: number;
  readonly mode: 'all' | 'min';
  readonly min: number;
  readonly title: string;
  readonly titleTouched: boolean;
}

/** Habitudes éligibles : ni hebdomadaires ni « X fois / semaine », sans défi en cours. */
export const challengeCandidates = (ctx: Ctx): readonly Habit[] =>
  liveHabits(ctx.db).filter(
    (h) =>
      h.type !== 'weekly' &&
      h.type !== 'times' &&
      !ctx.db.challenges.some((c: Challenge) => c.status === 'active' && c.habitId === h.id),
  );

export type ChallengeFormStart =
  | { readonly ok: true; readonly form: ChallengeFormState }
  | { readonly ok: false; readonly reason: 'max_active' | 'no_candidate' };

/** Formulaire initial : première habitude « à éviter » éligible, sinon la première éligible. */
export function startChallengeForm(ctx: Ctx): ChallengeFormStart {
  if (ctx.db.challenges.filter((c) => c.status === 'active').length >= CHAL_MAX_ACTIVE) return { ok: false, reason: 'max_active' };
  const candidates = challengeCandidates(ctx);
  const first = candidates.find((h) => h.type === 'bad') ?? candidates[0];
  if (!first) return { ok: false, reason: 'no_candidate' };
  return { ok: true, form: { habitId: first.id, days: 30, mode: 'all', min: 20, title: '', titleTouched: false } };
}

export interface ChallengePreview {
  readonly habit: Habit;
  readonly isBad: boolean;
  readonly minClamped: number;
  readonly activeDays: number;
  /** Jours à réussir. */
  readonly requiredDays: number;
  readonly reward: number;
  readonly autoTitle: string;
  readonly title: string;
}

export function challengePreview(ctx: Ctx, form: ChallengeFormState): ChallengePreview | null {
  const habit = ctx.db.habitDefs.find((h) => h.id === form.habitId);
  if (!habit) return null;
  const isBad = habit.type === 'bad';
  const minClamped = Math.min(Math.max(1, Number(form.min) || 1), form.days);
  const activeDays = chalActiveDays(ctx, habit, form.days);
  const requiredDays = form.mode === 'all' || isBad ? activeDays : Math.min(minClamped, activeDays);
  const autoTitle = chalTitle(habit, form.days, form.mode, Math.min(form.min, form.days));
  return {
    habit,
    isBad,
    minClamped,
    activeDays,
    requiredDays,
    reward: chalRewardFor(requiredDays),
    autoTitle,
    title: form.titleTouched ? form.title : autoTitle,
  };
}

/** Durée saisie librement : bornée à 3-365, ignorée si ce n'est pas un nombre. */
export const clampChallengeDays = (value: string, fallback: number): number => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.max(3, Math.min(365, n)) : fallback;
};

export const todayKey = (ctx: Ctx): DateKey => today(ctx);
