import type { PauseReason } from '../types/db';

export interface PauseReasonInfo {
  readonly id: PauseReason;
  readonly emoji: string;
  readonly label: string;
}

export const PAUSE_REASONS: readonly PauseReasonInfo[] = [
  { id: 'sick', emoji: '🤒', label: 'Malade' },
  { id: 'trip', emoji: '✈️', label: 'Voyage' },
  { id: 'tired', emoji: '😴', label: 'Épuisé' },
  { id: 'work', emoji: '💼', label: 'Trop de travail' },
  { id: 'party', emoji: '🎉', label: 'Soirée' },
  { id: 'other', emoji: '❓', label: 'Autre' },
];

export const PAUSE_PAST_DAYS = 7;
export const PAUSE_FUTURE_DAYS = 30;
export const PAUSE_MAX_RANGE = 14;
export const PAUSE_DEFAULT_QUOTA = 3;
export const PAUSE_MAX_QUOTA = 10;
