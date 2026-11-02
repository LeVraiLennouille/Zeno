export type BreathPatternId = 'box' | '478' | 'calm';
export type BreathPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Hold out';

export interface BreathPattern {
  readonly name: string;
  readonly phases: readonly BreathPhase[];
  /** Durée de chaque phase, en secondes. */
  readonly durations: readonly number[];
  readonly desc: string;
}

export const BREATHING_PATTERNS: Readonly<Record<BreathPatternId, BreathPattern>> = {
  box: {
    name: 'Respiration carrée',
    phases: ['Inhale', 'Hold', 'Exhale', 'Hold out'],
    durations: [4, 4, 4, 4],
    desc: 'Quatre temps égaux pour apaiser le stress et retrouver de la concentration.',
  },
  '478': {
    name: '4-7-8',
    phases: ['Inhale', 'Hold', 'Exhale'],
    durations: [4, 7, 8],
    desc: "Une longue expiration pour ralentir le rythme et favoriser l'endormissement.",
  },
  calm: {
    name: 'Calme',
    phases: ['Inhale', 'Hold', 'Exhale'],
    durations: [5, 2, 5],
    desc: 'Un rythme lent et régulier pour se détendre à tout moment.',
  },
};

export const BREATH_PATTERN_OPTIONS: readonly { readonly id: BreathPatternId; readonly title: string; readonly sub: string }[] = [
  { id: 'box', title: 'Carrée', sub: 'Concentration' },
  { id: '478', title: '4-7-8', sub: 'Sommeil' },
  { id: 'calm', title: 'Calme', sub: 'Détente' },
];

/** Libellé court de la liste des phases (« Inspire », « Retiens », « Expire »). */
export const BREATH_SHORT: Readonly<Record<BreathPhase, string>> = { Inhale: 'Inspire', Hold: 'Retiens', 'Hold out': 'Retiens', Exhale: 'Expire' };
/** Consigne affichée pendant la phase. */
export const BREATH_LABEL: Readonly<Record<BreathPhase, string>> = { Inhale: 'Inspirez', Hold: 'Retenez', 'Hold out': 'Retenez', Exhale: 'Expirez' };

export type BreathStatus = 'ready' | 'running' | 'stopped';

export interface BreathState {
  readonly status: BreathStatus;
  readonly pattern: BreathPatternId;
  readonly phaseIdx: number;
  readonly secondsLeft: number;
  readonly rounds: number;
}

const firstDuration = (p: BreathPatternId): number => BREATHING_PATTERNS[p].durations[0] ?? 4;

export const idleBreath = (pattern: BreathPatternId): BreathState => ({ status: 'ready', pattern, phaseIdx: 0, secondsLeft: firstDuration(pattern), rounds: 0 });

export const startBreath = (pattern: BreathPatternId): BreathState => ({ ...idleBreath(pattern), status: 'running' });

export const stopBreath = (s: BreathState): BreathState => ({ ...s, status: 'stopped' });

/** Changer de rythme arrête la séance et remet tout à zéro. */
export const selectBreathPattern = (pattern: BreathPatternId): BreathState => idleBreath(pattern);

/** Une seconde s'est écoulée : décompte, puis phase suivante ; un cycle est compté au retour sur « Inspire ». */
export function tickBreath(s: BreathState): BreathState {
  if (s.status !== 'running') return s;
  const p = BREATHING_PATTERNS[s.pattern];
  const left = s.secondsLeft - 1;
  if (left > 0) return { ...s, secondsLeft: left };
  const next = (s.phaseIdx + 1) % p.phases.length;
  return { ...s, phaseIdx: next, secondsLeft: p.durations[next] ?? 1, rounds: s.rounds + (next === 0 ? 1 : 0) };
}

export const currentPhase = (s: BreathState): BreathPhase => BREATHING_PATTERNS[s.pattern].phases[s.phaseIdx] ?? 'Inhale';

export const breathPhaseLabel = (s: BreathState): string =>
  s.status === 'ready' ? 'Prêt' : s.status === 'stopped' ? 'Terminé' : BREATH_LABEL[currentPhase(s)];

export type BreathMotion = 'rest' | 'inhale' | 'hold' | 'exhale';

/** Mouvement du cercle : s'agrandit en inspirant, se resserre en expirant, reste en l'état sinon. */
export function breathMotion(s: BreathState): BreathMotion {
  if (s.status !== 'running') return 'rest';
  const phase = currentPhase(s);
  return phase === 'Inhale' ? 'inhale' : phase === 'Exhale' ? 'exhale' : 'hold';
}

export const breathRoundsLabel = (rounds: number): string => (rounds > 1 ? 'cycles terminés' : 'cycle terminé');
