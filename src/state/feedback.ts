import type { DomainEvent, SoundId } from '../domain/types/events';

export type HapticStyle = 'light' | 'success' | 'warning';

/** Un retour sensoriel à déclencher `delayMs` après l'action. */
export type FeedbackItem =
  | { readonly kind: 'sound'; readonly sound: SoundId; readonly delayMs: number }
  | { readonly kind: 'haptic'; readonly style: HapticStyle; readonly delayMs: number }
  | {
      readonly kind: 'toast';
      readonly text: string;
      /** Nom d'icône (interface ou identifiant d'habitude). */
      readonly icon: string;
      readonly durationMs: number;
      readonly delayMs: number;
    }
  | { readonly kind: 'confetti'; readonly delayMs: number }
  | { readonly kind: 'flash'; readonly habitId: string; readonly delayMs: number };

const HAPTIC_FOR_SOUND: Readonly<Partial<Record<SoundId, HapticStyle>>> = {
  done: 'light',
  undo: 'light',
  drink: 'light',
  fail: 'warning',
  fanfare: 'success',
  bell: 'light',
  levelup: 'success',
};

/** Écart entre deux annonces de défi dans un même lot (comme la PWA). */
const CHALLENGE_STAGGER_MS = 2600;

/**
 * Traduit les événements du domaine en retours sensoriels, avec les textes et les
 * délais de la PWA d'origine. Pur et déterministe : c'est la seule table à modifier
 * pour changer l'expérience (la couche UI ne fait qu'exécuter la liste).
 */
export function eventsToFeedback(events: readonly DomainEvent[]): FeedbackItem[] {
  const out: FeedbackItem[] = [];
  let challengeOffset = 0;

  const sound = (s: SoundId, delayMs: number): void => {
    out.push({ kind: 'sound', sound: s, delayMs });
    const style = HAPTIC_FOR_SOUND[s];
    if (style) out.push({ kind: 'haptic', style, delayMs });
  };
  const toast = (text: string, icon: string, durationMs: number, delayMs: number): void => {
    out.push({ kind: 'toast', text, icon, durationMs, delayMs });
  };

  for (const e of events) {
    switch (e.type) {
      case 'sound':
        sound(e.sound, 0);
        break;
      case 'xp_gained':
        break;
      case 'meditation_done':
        sound('bell', 0);
        sound('bell', 2600);
        out.push({ kind: 'haptic', style: 'success', delayMs: 0 });
        toast(`Session terminée : ${e.minutes} min${e.xp !== null ? ` · +${e.xp} XP` : ''}`, 'zen', e.xp !== null ? 3600 : 3000, 0);
        break;
      case 'habit_flash':
        out.push({ kind: 'flash', habitId: e.habitId, delayMs: 0 });
        break;
      case 'level_up':
        sound('levelup', 300);
        toast(`Niveau ${e.level} atteint : ${e.name}`, 'star', 4000, 300);
        break;
      case 'season_rank_up':
        sound('levelup', 1800);
        toast(`Saison : rang ${e.roman} · ${e.name}`, 'star', 4000, 1800);
        break;
      case 'achievement_unlocked':
        toast(`Succès débloqué : ${e.name}`, 'trophy', 3500, e.order * 700);
        sound('done', e.order * 700);
        break;
      case 'goal_reached':
        toast(
          e.kind === 'drink' ? "Objectif d'hydratation atteint ! +10 XP" : `${e.habitName} : objectif atteint ! +${e.xp} XP`,
          e.kind === 'drink' ? 'drink' : e.habitId,
          3200,
          0,
        );
        break;
      case 'times_goal_reached':
        toast(`Objectif de la semaine atteint : ${e.done}/${e.required} « ${e.habitName} »`, 'star', 3400, 0);
        break;
      case 'perfect_day':
        out.push({ kind: 'confetti', delayMs: 0 });
        sound('fanfare', 0);
        if (e.bonusXp !== null) toast(`Journée parfaite ! +${e.bonusXp} XP`, 'star', 3500, 600);
        break;
      case 'challenge_won': {
        const at = 500 + challengeOffset;
        sound('fanfare', at);
        out.push({ kind: 'confetti', delayMs: at });
        toast(`Défi relevé : ${e.title} · +${e.reward} XP`, 'trophy', 4200, at);
        challengeOffset += CHALLENGE_STAGGER_MS;
        break;
      }
      case 'challenge_failed':
        toast(`Défi manqué : ${e.title}`, 'alert', 3600, 500 + challengeOffset);
        challengeOffset += CHALLENGE_STAGGER_MS;
        break;
    }
  }
  return out;
}
