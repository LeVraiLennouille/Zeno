import { DAY_FULL } from '../constants/calendar';
import { addDays, fmtDate } from '../date/calendar';
import { midnight, type Ctx } from '../date/clock';
import { isDayActive, isRequiredHabit, liveHabits } from '../habits/activity';
import { isHabitDoneOn } from '../habits/values';
import type { DateKey } from '../types/date';

export const INSIGHT_DAYS = 90;
export const INSIGHT_MIN_GROUP = 5;

/** Nombre au format français à une décimale (« 3,7 »). */
export const f1 = (n: number): string => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const avgOf = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

export interface InsightRow {
  readonly k: DateKey;
  readonly dow: number;
  readonly mood: number | null;
  readonly sleepH: number | null;
  readonly med: number;
  readonly rate: number | null;
  /** Par habitude : `null` = pas due ce jour-là, sinon faite ou non. */
  readonly done: Readonly<Record<string, boolean | null>>;
}

/** Une ligne par jour des `days` derniers jours (plus récent d'abord), jamais avant la création. */
export function insightRows(ctx: Ctx, days: number): readonly InsightRow[] {
  const { db } = ctx;
  const base = midnight(ctx);
  const rows: InsightRow[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(base, -i);
    const key = fmtDate(day);
    if (key < db.createdAt) break;
    const sleep = db.sleepLog[key];
    const done: Record<string, boolean | null> = {};
    let req = 0;
    let ok = 0;
    for (const h of db.habitDefs) {
      if (!isDayActive(db, h, day)) {
        done[h.id] = null;
        continue;
      }
      const d = isHabitDoneOn(db, h, key, day);
      done[h.id] = d;
      if (isRequiredHabit(h)) {
        req++;
        if (d) ok++;
      }
    }
    rows.push({
      k: key,
      dow: day.getDay(),
      mood: db.moods[key] ?? null,
      sleepH: sleep ? sleep.hours + (sleep.minutes || 0) / 60 : null,
      med: db.meditation[key] || 0,
      rate: req > 0 ? ok / req : null,
      done,
    });
  }
  return rows;
}

export interface Comparison {
  readonly a: number;
  readonly b: number;
  readonly diff: number;
  readonly n: number;
}

/** Humeur moyenne quand `pred` est vrai ou faux ; `null` si un des groupes a moins de 5 jours. */
export function compareMood(rows: readonly InsightRow[], pred: (r: InsightRow) => boolean | null | undefined): Comparison | null {
  const yes: number[] = [];
  const no: number[] = [];
  for (const r of rows) {
    if (r.mood == null) continue;
    const p = pred(r);
    if (p == null) continue;
    (p ? yes : no).push(r.mood);
  }
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes);
  const b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}

export function compareRate(rows: readonly InsightRow[], pred: (r: InsightRow) => boolean | null | undefined): Comparison | null {
  const yes: number[] = [];
  const no: number[] = [];
  for (const r of rows) {
    if (r.rate == null) continue;
    const p = pred(r);
    if (p == null) continue;
    (p ? yes : no).push(r.rate);
  }
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes);
  const b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}

export interface RichText {
  readonly text: string;
  readonly bold: boolean;
}

export interface Insight {
  readonly icon: string;
  readonly parts: readonly RichText[];
  readonly delta: string;
  readonly good: boolean;
  readonly n: number;
  readonly score: number;
}

const t = (text: string): RichText => ({ text, bold: false });
const b = (text: string): RichText => ({ text, bold: true });

export const plainText = (parts: readonly RichText[]): string => parts.map((p) => p.text).join('');

export function computeInsights(ctx: Ctx, rows: readonly InsightRow[]): readonly Insight[] {
  const out: Insight[] = [];
  const push = (icon: string, parts: readonly RichText[], c: Comparison | null, min = 0.3): void => {
    if (!c || Math.abs(c.diff) < min) return;
    out.push({ icon, parts, delta: `${c.diff > 0 ? '+' : '−'}${f1(Math.abs(c.diff))}`, good: c.diff > 0, n: c.n, score: Math.abs(c.diff) });
  };

  for (const h of liveHabits(ctx.db)) {
    if (h.type === 'weekly') continue;
    const c = compareMood(rows, (r) => r.done[h.id]);
    const name = `« ${h.name} »`;
    const verb = h.type === 'bad' ? `évites ${name}` : h.type === 'counter' || h.type === 'drink' ? `atteins ton objectif ${name}` : `fais ${name}`;
    push(h.emoji || '⭐', [t(`Les jours où tu ${verb}, ton humeur moyenne est de `), b(c ? f1(c.a) : ''), t(` (contre ${c ? f1(c.b) : ''} sinon).`)], c);
  }

  const sleep = compareMood(rows, (r) => (r.sleepH == null ? null : r.sleepH >= 7));
  push('😴', sleep ? [t('Après une nuit d’au moins 7 h, ton humeur moyenne est de '), b(f1(sleep.a)), t(` (contre ${f1(sleep.b)}).`)] : [], sleep);

  const med = compareMood(rows, (r) => r.med > 0);
  push('🧘', med ? [t('Les jours où tu médites, ton humeur moyenne est de '), b(f1(med.a)), t(` (contre ${f1(med.b)}).`)] : [], med);

  const strong = compareMood(rows, (r) => (r.rate == null ? null : r.rate >= 0.8));
  push('📈', strong ? [t('Quand tu valides au moins 80 % de tes habitudes, ton humeur moyenne est de '), b(f1(strong.a)), t(` (contre ${f1(strong.b)}).`)] : [], strong);

  const rate = compareRate(rows, (r) => (r.sleepH == null ? null : r.sleepH >= 7));
  if (rate && Math.abs(rate.diff) >= 0.08) {
    out.push({
      icon: '🌙',
      parts: [t('Après une nuit de 7 h ou plus, tu valides '), b(`${Math.round(rate.a * 100)} %`), t(` de tes habitudes (contre ${Math.round(rate.b * 100)} %).`)],
      delta: `${rate.diff > 0 ? '+' : '−'}${Math.round(Math.abs(rate.diff) * 100)} pts`,
      good: rate.diff > 0,
      n: rate.n,
      score: Math.abs(rate.diff) * 4,
    });
  }

  const byDow: Record<number, number[]> = {};
  for (const r of rows) if (r.mood != null) (byDow[r.dow] ??= []).push(r.mood);
  const dows = Object.entries(byDow)
    .filter(([, v]) => v.length >= 3)
    .map(([d, v]) => ({ d: Number(d), m: avgOf(v), n: v.length }));
  if (dows.length >= 4) {
    dows.sort((x, y) => y.m - x.m);
    const hi = dows[0];
    const lo = dows[dows.length - 1];
    if (hi && lo && hi.m - lo.m >= 0.5) {
      out.push({
        icon: '📅',
        parts: [
          t('Ton jour le plus lumineux est le '),
          b((DAY_FULL[hi.d] ?? '').toLowerCase()),
          t(` (${f1(hi.m)}), le plus difficile le `),
          b((DAY_FULL[lo.d] ?? '').toLowerCase()),
          t(` (${f1(lo.m)}).`),
        ],
        delta: '',
        good: true,
        n: dows.reduce((s, x) => s + x.n, 0),
        score: (hi.m - lo.m) * 0.7,
      });
    }
  }
  return out.filter((i) => plainText(i.parts)).sort((x, y) => y.score - x.score).slice(0, 6);
}

export interface InsightsModel {
  readonly daysWithMood: number;
  readonly enough: boolean;
  readonly averageMood: number | null;
  readonly items: readonly Insight[];
}

export function insightsModel(ctx: Ctx): InsightsModel {
  const rows = insightRows(ctx, INSIGHT_DAYS);
  const withMood = rows.filter((r) => r.mood != null);
  if (withMood.length < 7) return { daysWithMood: withMood.length, enough: false, averageMood: null, items: [] };
  return {
    daysWithMood: withMood.length,
    enough: true,
    averageMood: avgOf(withMood.map((r) => r.mood ?? 0)),
    items: computeInsights(ctx, rows),
  };
}
