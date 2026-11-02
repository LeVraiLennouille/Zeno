export type Ambience = 'silence' | 'rain' | 'ocean' | 'drone';

export const MED_DURATIONS: readonly { readonly minutes: number; readonly title: string; readonly sub: string }[] = [
  { minutes: 5, title: '5 min', sub: 'Pause' },
  { minutes: 10, title: '10 min', sub: 'Équilibre' },
  { minutes: 20, title: '20 min', sub: 'Profonde' },
];

export const MED_AMBIENCES: readonly { readonly id: Ambience; readonly label: string }[] = [
  { id: 'silence', label: 'Silence' },
  { id: 'rain', label: 'Pluie' },
  { id: 'ocean', label: 'Océan' },
  { id: 'drone', label: 'Drone' },
];

export const MED_DESC: Readonly<Record<Ambience, string>> = {
  silence: 'Un silence apaisé, ponctué par une cloche au début et à la fin.',
  rain: 'Une pluie douce et continue pour couvrir les bruits alentour.',
  ocean: 'Des vagues lentes qui montent et descendent, comme une respiration.',
  drone: 'Une nappe grave et chaude, sans rythme, pour se poser.',
};

export type MedPhase = 'idle' | 'running' | 'paused' | 'done';

export interface MedState {
  /** Durée choisie, en secondes. */
  readonly dur: number;
  readonly amb: Ambience;
  readonly state: MedPhase;
  /** Secondes restantes (valeur figée tant que la séance n'est pas en cours). */
  readonly remaining: number;
  /** Instant de fin (ms) quand la séance est en cours. */
  readonly endAt: number;
}

export const initialMed = (): MedState => ({ dur: 600, amb: 'silence', state: 'idle', remaining: 600, endAt: 0 });

const active = (s: MedState): boolean => s.state === 'running' || s.state === 'paused';

/** Secondes écoulées (calculées à l'horloge : la séance survit à une mise en veille de l'écran). */
export function medElapsed(s: MedState, nowMs: number): number {
  const left = s.state === 'running' ? Math.max(0, Math.ceil((s.endAt - nowMs) / 1000)) : s.remaining;
  return Math.max(0, s.dur - left);
}

export const medSelectDuration = (s: MedState, minutes: number): MedState =>
  active(s) ? s : { ...s, dur: minutes * 60, remaining: minutes * 60, state: 'idle' };

export const medSelectAmbience = (s: MedState, amb: Ambience): MedState => ({ ...s, amb });

/** Démarre (`fresh`) ou reprend la séance. */
export function medRun(s: MedState, nowMs: number, fresh: boolean): MedState {
  const remaining = fresh ? s.dur : s.remaining;
  return { ...s, state: 'running', remaining, endAt: nowMs + remaining * 1000 };
}

export const medPause = (s: MedState, nowMs: number): MedState =>
  s.state === 'running' ? { ...s, state: 'paused', remaining: Math.max(1, Math.ceil((s.endAt - nowMs) / 1000)) } : s;

export interface MedTick {
  readonly state: MedState;
  readonly completed: boolean;
}

/** Appelé quatre fois par seconde pendant la séance. */
export function medTick(s: MedState, nowMs: number): MedTick {
  if (s.state !== 'running') return { state: s, completed: false };
  const left = (s.endAt - nowMs) / 1000;
  if (left <= 0) return { state: { ...s, state: 'done', remaining: 0 }, completed: true };
  const remaining = Math.ceil(left);
  return { state: remaining === s.remaining ? s : { ...s, remaining }, completed: false };
}

/** Arrêt volontaire : retour à l'état initial. */
export const medStop = (s: MedState): MedState => (active(s) ? { ...s, state: 'idle', remaining: s.dur } : s);

export const medIsActive = active;

/** Avancement 0-1 de l'anneau. */
export function medProgress(s: MedState, nowMs: number): number {
  if (s.state === 'idle') return 0;
  const d = s.state === 'running' ? 1 - Math.max(0, (s.endAt - nowMs) / 1000) / s.dur : s.state === 'done' ? 1 : 1 - s.remaining / s.dur;
  return Math.min(1, Math.max(0, d));
}

export const medClock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const medStatusLabel = (s: MedState): string =>
  s.state === 'running' ? 'En cours' : s.state === 'paused' ? 'En pause' : s.state === 'done' ? 'Session terminée ✓' : 'Prêt';

export const medDescription = (amb: Ambience, soundEnabled: boolean): string =>
  MED_DESC[amb] + (soundEnabled ? '' : ' (Les sons sont désactivés dans ton compte.)');

export const medStartLabel = (s: MedState): string =>
  s.state === 'running' ? 'Pause' : s.state === 'paused' ? 'Reprendre' : s.state === 'done' ? 'Recommencer' : 'Commencer';
