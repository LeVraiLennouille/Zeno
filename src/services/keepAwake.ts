import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'zeno-meditation';

/** Garde l'écran allumé pendant une séance ; sans effet si l'appareil refuse. */
export async function keepScreenOn(): Promise<void> {
  try {
    await activateKeepAwakeAsync(TAG);
  } catch {
    /* ignoré */
  }
}

export function releaseScreen(): void {
  try {
    void deactivateKeepAwake(TAG);
  } catch {
    /* ignoré */
  }
}
