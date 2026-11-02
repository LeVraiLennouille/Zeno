import { ROMAN, SEASON_DEFS, SEASON_RANKS, type SeasonDef, type SeasonRankDef } from '../constants/seasons';
import { appNow, type Ctx } from '../date/clock';

export interface Season {
  /** Identifiant stable, ex. `winter-2026`. */
  readonly id: string;
  readonly def: SeasonDef;
  readonly start: Date;
  readonly end: Date;
  readonly label: string;
}

export const seasonLabel = (def: SeasonDef, year: number): string =>
  def.key === 'winter' ? `${def.name} ${year}/${String(year + 1).slice(2)}` : `${def.name} ${year}`;

/** Saison contenant `date` (l'hiver de janvier-février appartient à l'année précédente). */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  const def = SEASON_DEFS.find((s) => s.months.includes(month)) ?? SEASON_DEFS[0]!;
  const year = def.key === 'winter' && month < 2 ? date.getFullYear() - 1 : date.getFullYear();
  const first = def.months[0] ?? 0;
  return {
    id: `${def.key}-${year}`,
    def,
    start: new Date(year, first, 1),
    end: new Date(year, first + 3, 0),
    label: seasonLabel(def, year),
  };
}

export function seasonFromId(id: string): { def: SeasonDef; label: string } {
  const [key, year] = String(id).split('-');
  const def = SEASON_DEFS.find((s) => s.key === key);
  return def ? { def, label: seasonLabel(def, Number(year)) } : { def: SEASON_DEFS[0]!, label: id };
}

export interface SeasonRank {
  readonly index: number;
  /** Rang 1-12. */
  readonly rank: number;
  readonly roman: string;
  readonly name: string;
  readonly next: SeasonRankDef | null;
  readonly pct: number;
  readonly needed: number;
}

export function seasonRank(xp: number): SeasonRank {
  const value = xp || 0;
  let index = 0;
  SEASON_RANKS.forEach((r, i) => {
    if (value >= r.xp) index = i;
  });
  const cur = SEASON_RANKS[index]!;
  const next = SEASON_RANKS[index + 1] ?? null;
  return {
    index,
    rank: index + 1,
    roman: ROMAN[index] ?? String(index + 1),
    name: cur.name,
    next,
    pct: next ? Math.round(((value - cur.xp) / (next.xp - cur.xp)) * 100) : 100,
    needed: next ? next.xp - value : 0,
  };
}

export const currentSeasonXp = (ctx: Ctx): number => ctx.db.seasonXp[seasonOf(appNow(ctx)).id] ?? 0;
