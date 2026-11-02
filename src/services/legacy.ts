import { Platform } from 'react-native';

import { readLegacyLocalStorage, type LegacySource } from '@/state';

interface WebStorage {
  getItem(key: string): string | null;
}

/**
 * Sur le web, reprend les données de l'ancienne PWA si elle était servie sur la même
 * origine (clé `ht-v2.6`). Sur mobile, l'import passe par le fichier de sauvegarde.
 */
export const legacySource: LegacySource | undefined =
  Platform.OS === 'web'
    ? readLegacyLocalStorage((globalThis as unknown as { localStorage?: WebStorage }).localStorage)
    : undefined;
