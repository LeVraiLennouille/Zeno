import * as Haptics from 'expo-haptics';

import type { HapticStyle } from '@/state';

/** Vibrations légères ; sans effet (et sans erreur) sur le web ou si l'appareil ne les gère pas. */
export function haptic(style: HapticStyle): void {
  try {
    if (style === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (style === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    /* non disponible */
  }
}
