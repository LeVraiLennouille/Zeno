import { LEVEL_THRESHOLDS } from '../constants/gamification';
import { SEASON_RANKS } from '../constants/seasons';
import { type Ctx } from '../date/clock';
import { wonChallenges } from '../challenges/challenge';
import { seasonRank } from '../challenges/season';
import { findHabit, liveHabits } from '../habits/activity';
import { calcStreak } from '../habits/streaks';
import { checkGymMonth, checkPerfectWeek } from './daily';
import { calcLevel } from './levels';

export interface Achievement {
  readonly id: string;
  readonly emoji: string;
  readonly name: string;
  readonly desc: string;
  readonly check: (ctx: Ctx) => boolean;
}

/** Série en cours d'au moins `n` sur l'habitude `id` (archivée ou non), faux si elle n'existe pas. */
const streakOf = (ctx: Ctx, id: string, n: number): boolean => {
  const h = findHabit(ctx.db, id);
  return h !== undefined && calcStreak(ctx, h).current >= n;
};

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first_habit', emoji: '🌱', name: 'Premier pas', desc: 'Valide ta première habitude',
    check: ({ db }) => Object.values(db.habits).some((h) => Object.keys(h.logs).length > 0) },
  { id: 'camel', emoji: '🐫', name: 'Chameau', desc: "7 jours d'affilée à l'objectif eau",
    check: (c) => streakOf(c, 'drink', 7) },
  { id: 'perfect_wk', emoji: '⭐', name: 'Semaine parfaite', desc: '100 % de réussite sur une semaine complète',
    check: (c) => checkPerfectWeek(c) },
  { id: 'king', emoji: '👑', name: 'Maîtrise de soi', desc: 'Aucune mauvaise habitude pendant 14 jours',
    check: (c) => {
      const bad = liveHabits(c.db).filter((h) => h.type === 'bad');
      return bad.length > 0 && bad.every((h) => calcStreak(c, h).current >= 14);
    } },
  { id: 'centurion', emoji: '⚔️', name: 'Centurion', desc: 'Cumule 100 XP', check: ({ db }) => db.xp >= 100 },
  { id: 'on_fire', emoji: '🔥', name: 'En feu', desc: 'Atteins le niveau 5', check: ({ db }) => calcLevel(db.xp) >= 5 },
  { id: 'bookworm', emoji: '📖', name: 'Rat de bibliothèque', desc: 'Série de lecture de 14 jours',
    check: (c) => streakOf(c, 'read', 14) },
  { id: 'ironwill', emoji: '💪', name: 'Volonté de fer', desc: '20 séances de gym dans le mois',
    check: (c) => checkGymMonth(c) },
  { id: 'consistent', emoji: '🌅', name: 'Régularité', desc: 'Série de 30 jours ou plus sur une habitude',
    check: (c) => liveHabits(c.db).some((h) => calcStreak(c, h).current >= 30) },
  { id: 'night_tmd', emoji: '🌙', name: 'Hibou apprivoisé', desc: 'Série de sommeil de 14 jours',
    check: (c) => streakOf(c, 'sleep', 14) },
  { id: 'xp_500', emoji: '💎', name: "Réserve d'XP", desc: 'Cumule 500 XP', check: ({ db }) => db.xp >= 500 },
  { id: 'dedicated', emoji: '🎯', name: 'Dévouement', desc: 'Série de 60 jours ou plus sur une habitude',
    check: (c) => liveHabits(c.db).some((h) => calcStreak(c, h).current >= 60) },
  { id: 'perfectist', emoji: '💯', name: 'Perfectionniste', desc: '5 journées parfaites',
    check: ({ db }) => db.perfectDaysClaimed.length >= 5 },
  { id: 'hydration', emoji: '🌊', name: 'Hydratation parfaite', desc: "30 jours d'affilée à l'objectif eau",
    check: (c) => streakOf(c, 'drink', 30) },
  { id: 'transcend', emoji: '🌌', name: 'Transcendance', desc: 'Atteins le niveau maximal',
    check: ({ db }) => calcLevel(db.xp) >= LEVEL_THRESHOLDS.length },
  { id: 'walker', emoji: '👣', name: 'Sur la route', desc: '10 000 pas par jour pendant 7 jours',
    check: (c) => streakOf(c, 'setp', 7) },
  { id: 'marathoner', emoji: '🏅', name: 'Marathon', desc: '10 000 pas par jour pendant 30 jours',
    check: (c) => streakOf(c, 'setp', 30) },
  { id: 'calm_mind', emoji: '🧘', name: 'Esprit calme', desc: 'Médite pendant au moins 5 minutes',
    check: ({ db }) => Object.values(db.meditation).some((m) => m >= 5) },
  { id: 'mindful_wk', emoji: '🪷', name: 'Pleine conscience', desc: 'Médite pendant 7 jours différents',
    check: ({ db }) => Object.values(db.meditation).filter((m) => m >= 1).length >= 7 },
  { id: 'chal_first', emoji: '🎯', name: 'Défi relevé', desc: 'Remporte ton premier défi',
    check: ({ db }) => wonChallenges(db.challenges).length >= 1 },
  { id: 'chal_five', emoji: '🏹', name: 'Chasseur de défis', desc: 'Remporte 5 défis',
    check: ({ db }) => wonChallenges(db.challenges).length >= 5 },
  { id: 'chal_30', emoji: '🏔️', name: 'Trente jours', desc: 'Remporte un défi de 30 jours ou plus',
    check: ({ db }) => wonChallenges(db.challenges).some((c) => c.days >= 30) },
  { id: 'season_5', emoji: '🌟', name: 'Rang V', desc: 'Atteins le rang V dans une saison',
    check: ({ db }) => Object.values(db.seasonXp).some((xp) => seasonRank(xp).rank >= 5) },
  { id: 'season_max', emoji: '🏆', name: 'Sommet de saison', desc: "Atteins le rang maximal d'une saison",
    check: ({ db }) => Object.values(db.seasonXp).some((xp) => seasonRank(xp).rank >= SEASON_RANKS.length) },
];

export const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((a) => a.id));
