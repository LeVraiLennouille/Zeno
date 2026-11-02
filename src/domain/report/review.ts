import { DAY_FULL, MONTH_SHORT } from '../constants/calendar';
import { MOOD_EMOJIS } from '../constants/gamification';
import { ROMAN } from '../constants/seasons';
import { addDays, fmtDate, getWeekMonday, parseDate } from '../date/calendar';
import { appNow, today, type Ctx } from '../date/clock';
import { Tx } from '../actions/tx';
import { challengeCandidates } from '../selectors/challenges';
import { currentSeasonXp, seasonOf, seasonRank } from '../challenges/season';
import { fmtNum } from '../format';
import { isDayActive, isRequiredHabit, liveHabits } from '../habits/activity';
import { calcStreak } from '../habits/streaks';
import { streakWords, timesWeekInfo, weeklyUnit } from '../habits/times';
import { getHabitDayValue } from '../habits/values';
import type { DateKey } from '../types/date';
import type { Db } from '../types/db';
import type { Habit } from '../types/habit';
import { f1 } from './insights';

export const lastWeekMonday = (ctx: Ctx): DateKey => fmtDate(addDays(parseDate(getWeekMonday(appNow(ctx))), -7));

/** « 19 oct – 25 oct ». */
export function mondayLabel(monday: DateKey): string {
  const a = parseDate(monday);
  const b = addDays(a, 6);
  const m = (d: Date): string => (MONTH_SHORT[d.getMonth()] ?? '').toLowerCase();
  return `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
}

export interface ReviewHabitStat {
  readonly habit: Habit;
  req: number;
  done: number;
  readonly times?: boolean;
  readonly count?: number;
}

export interface ReviewDay {
  readonly k: DateKey;
  readonly d: Date;
  readonly req: number;
  readonly done: number;
  readonly rate: number | null;
}

export interface WeekReview {
  readonly mon: DateKey;
  readonly req: number;
  readonly done: number;
  readonly rate: number | null;
  readonly activeDays: number;
  readonly perDay: readonly ReviewDay[];
  readonly best: ReviewDay | null;
  readonly forgotten: ReviewHabitStat | null;
  readonly perfect: number;
  readonly xp: number | null;
  readonly moodAvg: number | null;
  readonly moodN: number;
}

export function weekReviewData(ctx: Ctx, monday: DateKey): WeekReview {
  const { db } = ctx;
  const start = parseDate(monday);
  const todayKey = today(ctx);
  let req = 0;
  let done = 0;
  let activeDays = 0;
  const stats = new Map<string, ReviewHabitStat>();
  const perDay: ReviewDay[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const key = fmtDate(day);
    if (key > todayKey) break;
    let n = 0;
    let c = 0;
    for (const h of db.habitDefs) {
      if (!isRequiredHabit(h) || !isDayActive(db, h, day) || key < db.createdAt) continue;
      n++;
      const ok = getHabitDayValue(db, h, key, day) >= 1;
      if (ok) c++;
      let st = stats.get(h.id);
      if (!st) {
        st = { habit: h, req: 0, done: 0 };
        stats.set(h.id, st);
      }
      st.req++;
      if (ok) st.done++;
    }
    req += n;
    done += c;
    if (n > 0) activeDays++;
    perDay.push({ k: key, d: day, req: n, done: c, rate: n ? c / n : null });
  }

  for (const h of db.habitDefs) {
    if (h.type !== 'times' || h.optional) continue;
    const w = timesWeekInfo(ctx, h, monday);
    if (w.required > 0) {
      const r = Math.min(w.done, w.required);
      req += w.required;
      done += r;
      stats.set(h.id, { habit: h, req: w.required, done: r, times: true, count: w.done });
    }
  }

  const ranked = perDay.filter((d) => d.rate != null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
  const forgotten =
    [...stats.values()]
      .filter((s) => s.req >= (s.times ? 1 : 3) && s.done < s.req)
      .sort((a, b) => a.done / a.req - b.done / b.req || b.req - b.done - (a.req - a.done))[0] ?? null;
  const end = fmtDate(addDays(start, 6));
  const moods = Object.keys(db.moods)
    .filter((k) => k >= monday && k <= end)
    .map((k): number => db.moods[k as DateKey] ?? 0);
  return {
    mon: monday,
    req,
    done,
    rate: req > 0 ? done / req : null,
    activeDays,
    perDay,
    best: ranked[0] ?? null,
    forgotten,
    perfect: db.perfectDaysClaimed.filter((k) => k >= monday && k <= end).length,
    xp: db.xpWeek[monday] ?? null,
    moodAvg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    moodN: moods.length,
  };
}

export interface BestStreak {
  readonly habit: Habit;
  readonly n: number;
  readonly days: number;
}

export function bestStreakNow(ctx: Ctx): BestStreak | null {
  let best: BestStreak | null = null;
  for (const h of liveHabits(ctx.db)) {
    const n = calcStreak(ctx, h).current;
    if (n <= 0) continue;
    const days = n * (weeklyUnit(h) ? 7 : 1);
    if (!best || days > best.days) best = { habit: h, n, days };
  }
  return best;
}

export const verdictFor = (rate: number | null): string =>
  rate == null
    ? 'Semaine calme'
    : rate >= 0.9
      ? 'Semaine exceptionnelle'
      : rate >= 0.7
        ? 'Belle semaine'
        : rate >= 0.5
          ? 'Semaine correcte'
          : 'Semaine difficile : on repart du bon pied';

/** Résumé partageable (bouton « Copier le résumé »). */
export function reviewSummaryText(ctx: Ctx, review: WeekReview, previousRate: number | null): string {
  const pct = review.rate == null ? null : Math.round(review.rate * 100);
  const lines = [`Bilan Zeno · ${mondayLabel(review.mon)}`];
  let score = `Score : ${pct == null ? '–' : `${pct} %`}`;
  if (previousRate != null && pct != null) {
    const d = pct - Math.round(previousRate * 100);
    score += ` (${d >= 0 ? '+' : ''}${d} pts)`;
  }
  lines.push(score);
  const best = bestStreakNow(ctx);
  if (best) lines.push(`Meilleure série : ${best.habit.name} · ${streakWords(best.habit, best.n)}`);
  if (review.xp != null) lines.push(`XP : +${review.xp}`);
  lines.push(`Journées parfaites : ${review.perfect}`);
  if (review.forgotten) lines.push(`À retravailler : ${review.forgotten.habit.name} (${review.forgotten.done}/${review.forgotten.req})`);
  return lines.join('\n');
}

export function reviewDue(ctx: Ctx): boolean {
  const { db } = ctx;
  if (db.profile.weeklyReview === false) return false;
  const last = lastWeekMonday(ctx);
  if ((db.profile.reviewedWeek && db.profile.reviewedWeek >= last) || fmtDate(addDays(parseDate(last), 6)) < db.createdAt) return false;
  const r = weekReviewData(ctx, last);
  return r.req > 0 && r.activeDays >= 3;
}

/** Note la semaine comme « vue » : le bilan ne sera plus proposé automatiquement. */
export function markReviewed(ctx: Ctx, monday: DateKey): Db {
  const tx = new Tx(ctx.db, ctx.clock);
  tx.patch({ profile: { ...ctx.db.profile, reviewedWeek: monday } });
  return tx.db;
}

export interface ReviewTile {
  readonly icon: string;
  readonly value: string;
  readonly label: string;
}

export interface ReviewModel {
  readonly mon: DateKey;
  readonly range: string;
  readonly score: number | null;
  readonly delta: { readonly pts: number; readonly sign: '+' | '−' | '=' } | null;
  readonly verdict: string;
  readonly sub: string;
  readonly tiles: readonly ReviewTile[];
  readonly season: { readonly emoji: string; readonly label: string; readonly rank: string; readonly pct: number; readonly foot: string };
  readonly forgotten: {
    readonly habit: Habit;
    readonly detail: string;
    readonly canChallenge: boolean;
  } | null;
  readonly emptyForgotten: string;
  readonly bestDay: { readonly day: string; readonly pct: number } | null;
  readonly summary: string;
}

export function reviewModel(ctx: Ctx, monday: DateKey): ReviewModel {
  const e = weekReviewData(ctx, monday);
  const prev = weekReviewData(ctx, fmtDate(addDays(parseDate(monday), -7))).rate;
  const score = e.rate == null ? null : Math.round(e.rate * 100);
  const diff = score != null && prev != null ? score - Math.round(prev * 100) : null;
  const streak = bestStreakNow(ctx);
  const season = seasonOf(appNow(ctx));
  const rank = seasonRank(currentSeasonXp(ctx));
  const f = e.forgotten;
  return {
    mon: monday,
    range: mondayLabel(monday),
    score,
    delta: diff == null ? null : { pts: Math.abs(diff), sign: diff > 0 ? '+' : diff < 0 ? '−' : '=' },
    verdict: verdictFor(e.rate),
    sub: `${e.done} / ${e.req} objectifs atteints`,
    tiles: [
      {
        icon: '🔥',
        value: streak ? streakWords(streak.habit, streak.n) : '–',
        label: streak ? `Meilleure série · ${streak.habit.name}` : 'Meilleure série',
      },
      { icon: '⚡', value: e.xp != null ? `+${fmtNum(e.xp)}` : '–', label: 'XP gagnée' },
      { icon: '⭐', value: `${e.perfect} / 7`, label: 'Journées parfaites' },
      { icon: '😊', value: e.moodAvg == null ? '–' : `${MOOD_EMOJIS[Math.round(e.moodAvg)] ?? ''} ${f1(e.moodAvg)}`, label: 'Humeur moyenne' },
    ],
    season: {
      emoji: season.def.emoji,
      label: `Saison · ${season.label}`,
      rank: `Rang ${rank.roman} · ${rank.name}`,
      pct: rank.pct,
      foot: rank.next ? `encore ${fmtNum(rank.needed)} XP pour le rang ${ROMAN[rank.index + 1]}` : 'Rang maximal atteint !',
    },
    forgotten: f
      ? {
          habit: f.habit,
          detail:
            f.times && f.habit.type === 'times'
              ? `${f.count} séance${(f.count ?? 0) > 1 ? 's' : ''} sur ${f.habit.target}`
              : `${f.done} jour${f.done > 1 ? 's' : ''} sur ${f.req}`,
          canChallenge: challengeCandidates(ctx).some((h) => h.id === f.habit.id),
        }
      : null,
    emptyForgotten: e.req > 0 ? 'Rien à signaler : tout est tenu. Bravo !' : 'Pas assez de données cette semaine.',
    bestDay: e.best && e.best.rate != null ? { day: (DAY_FULL[e.best.d.getDay()] ?? '').toLowerCase(), pct: Math.round(e.best.rate * 100) } : null,
    summary: reviewSummaryText(ctx, e, prev),
  };
}

export interface ReviewCardModel {
  readonly mon: DateKey;
  readonly label: string;
  readonly score: string;
  readonly verdict: string;
}

export function reviewCardModel(ctx: Ctx): ReviewCardModel {
  const mon = lastWeekMonday(ctx);
  const e = weekReviewData(ctx, mon);
  return { mon, label: mondayLabel(mon), score: e.rate == null ? '–' : `${Math.round(e.rate * 100)} %`, verdict: verdictFor(e.rate) };
}
