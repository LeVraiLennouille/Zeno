import { LEVEL_NAMES } from '../constants/gamification';
import { type Ctx } from '../date/clock';
import { ACHIEVEMENTS, type Achievement } from '../gamification/achievements';
import { calcLevel, xpProgress, type XpProgress } from '../gamification/levels';
import { avatarEmoji } from '../profile/profile';
import type { Profile } from '../types/db';

/** Regroupement de la page « Succès » (ordre et libellés de la PWA). */
export const ACHIEVEMENT_GROUPS: readonly { readonly label: string; readonly ids: readonly string[] }[] = [
  { label: 'Séries et régularité', ids: ['consistent', 'dedicated', 'camel', 'hydration', 'bookworm', 'night_tmd', 'king'] },
  { label: 'Étapes et XP', ids: ['first_habit', 'centurion', 'xp_500', 'on_fire', 'transcend'] },
  { label: 'Journées parfaites', ids: ['perfect_wk', 'perfectist', 'ironwill'] },
  { label: 'Bien-être', ids: ['calm_mind', 'mindful_wk'] },
  { label: 'Défis et saisons', ids: ['chal_first', 'chal_five', 'chal_30', 'season_5', 'season_max'] },
];

export interface AchievementItem {
  readonly id: string;
  readonly emoji: string;
  readonly name: string;
  readonly desc: string;
  readonly unlocked: boolean;
}

export interface AchievementSection {
  readonly label: string;
  readonly items: readonly AchievementItem[];
}

export interface AchievementsModel {
  readonly unlocked: number;
  readonly total: number;
  readonly pct: number;
  readonly sections: readonly AchievementSection[];
}

export function achievementsModel(ctx: Ctx): AchievementsModel {
  const have = new Set(ctx.db.unlockedAchievements);
  const item = (a: Achievement): AchievementItem => ({
    id: a.id,
    emoji: a.emoji,
    name: a.name,
    desc: a.desc,
    unlocked: have.has(a.id),
  });
  const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a] as const));
  const grouped = new Set(ACHIEVEMENT_GROUPS.flatMap((g) => g.ids));
  const sections: AchievementSection[] = ACHIEVEMENT_GROUPS.map((g) => ({
    label: g.label,
    items: g.ids.flatMap((id) => {
      const a = byId.get(id);
      return a ? [item(a)] : [];
    }),
  }));
  const others = ACHIEVEMENTS.filter((a) => !grouped.has(a.id)).map(item);
  if (others.length) sections.push({ label: 'Autres', items: others });
  const total = ACHIEVEMENTS.length;
  const unlocked = ctx.db.unlockedAchievements.length;
  return { unlocked, total, pct: Math.round((unlocked / total) * 100), sections };
}

export interface AccountModel {
  readonly name: string;
  readonly avatar: string;
  readonly level: number;
  readonly levelName: string;
  readonly xp: number;
  readonly xpProgress: XpProgress;
  readonly prefs: Pick<Profile, 'soundEnabled' | 'zenMode' | 'weeklyReview' | 'notifsEnabled' | 'themeMode' | 'dayStartHour'>;
}

export function accountModel(ctx: Ctx): AccountModel {
  const { db } = ctx;
  const level = calcLevel(db.xp);
  const p = db.profile;
  return {
    name: p.name || 'Mon profil',
    avatar: avatarEmoji(db),
    level,
    levelName: LEVEL_NAMES[level - 1] ?? 'Novice',
    xp: db.xp,
    xpProgress: xpProgress(db.xp),
    prefs: {
      soundEnabled: p.soundEnabled,
      zenMode: p.zenMode,
      weeklyReview: p.weeklyReview,
      notifsEnabled: p.notifsEnabled,
      themeMode: p.themeMode,
      dayStartHour: p.dayStartHour,
    },
  };
}
