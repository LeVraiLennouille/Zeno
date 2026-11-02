import { createBus, type FeedbackPorts, type ToastRequest } from '@/state';

import { haptic } from './haptics';
import { soundPlayer } from './sound';

/** Canaux vers l'interface : les composants s'y abonnent, les services y publient. */
export const toastBus = createBus<ToastRequest>();
export const confettiBus = createBus<void>();
export const flashBus = createBus<string>();

export const feedbackPorts: FeedbackPorts = {
  playSound: (sound) => soundPlayer.play(sound),
  haptic,
  toast: (toast) => toastBus.emit(toast),
  confetti: () => confettiBus.emit(undefined),
  flash: (habitId) => flashBus.emit(habitId),
};
