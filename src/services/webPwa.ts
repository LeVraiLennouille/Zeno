import { Platform } from 'react-native';

interface Doc {
  querySelector(selector: string): unknown;
  createElement(tag: string): { rel: string; href: string };
  head: { appendChild(node: unknown): void };
}
interface Nav {
  serviceWorker?: { register(url: string): Promise<unknown> };
  storage?: { persist?: () => Promise<boolean> };
}

/**
 * Version web uniquement : lien vers le manifeste (si la page ne l'a pas déjà), service worker
 * hors ligne (hors développement) et demande de stockage persistant, pour que le navigateur
 * n'efface pas les données en cas de manque de place.
 */
export function setupWebPwa(): void {
  if (Platform.OS !== 'web') return;
  try {
    const g = globalThis as unknown as { document?: Doc; navigator?: Nav };
    const doc = g.document;
    if (doc && !doc.querySelector('link[rel="manifest"]')) {
      const link = doc.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      doc.head.appendChild(link);
    }
    if (!__DEV__) void g.navigator?.serviceWorker?.register('/sw.js');
    void g.navigator?.storage?.persist?.();
  } catch {
    /* le navigateur refuse : l'app fonctionne sans */
  }
}
