import { toastBus } from './feedbackPorts';

/** Message ponctuel (durées de la PWA : 2,2 à 4 s). */
export function notify(text: string, icon = 'star', durationMs = 2600): void {
  toastBus.emit({ text, icon, durationMs });
}

/** Message avec bouton « Annuler » (archivage, suppression). */
export function notifyUndo(text: string, onUndo: () => void, durationMs = 6000): void {
  toastBus.emit({ text, icon: 'trash', durationMs, action: { label: 'Annuler', run: onUndo } });
}
