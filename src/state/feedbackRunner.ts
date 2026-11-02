import type { SoundId } from '../domain';
import type { FeedbackItem, HapticStyle } from './feedback';
import type { Timers } from './store';

export interface ToastRequest {
  readonly text: string;
  readonly icon: string;
  readonly durationMs: number;
  /** Bouton d'action (ex. « Annuler »). */
  readonly action?: { readonly label: string; readonly run: () => void };
}

/** Ce que l'interface sait faire ; chaque port est implémenté côté React Native. */
export interface FeedbackPorts {
  playSound(sound: SoundId): void;
  haptic(style: HapticStyle): void;
  toast(toast: ToastRequest): void;
  confetti(): void;
  flash(habitId: string): void;
}

export interface RunOptions {
  /** Réglage « Effets sonores » : coupe les sons, pas les toasts. */
  readonly soundEnabled: boolean;
  readonly timers: Timers;
}

/** Exécute une liste de retours : immédiatement (délai 0) ou après `delayMs`. */
export function runFeedback(items: readonly FeedbackItem[], ports: FeedbackPorts, options: RunOptions): void {
  const perform = (item: FeedbackItem): void => {
    switch (item.kind) {
      case 'sound':
        if (options.soundEnabled) ports.playSound(item.sound);
        break;
      case 'haptic':
        ports.haptic(item.style);
        break;
      case 'toast':
        ports.toast({ text: item.text, icon: item.icon, durationMs: item.durationMs });
        break;
      case 'confetti':
        ports.confetti();
        break;
      case 'flash':
        ports.flash(item.habitId);
        break;
    }
  };
  for (const item of items) {
    if (item.delayMs > 0) options.timers.set(() => perform(item), item.delayMs);
    else perform(item);
  }
}
