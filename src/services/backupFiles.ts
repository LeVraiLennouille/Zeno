import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { IMPORT_MAX_BYTES } from '@/domain';

export type ExportOutcome = 'shared' | 'downloaded' | 'failed';

/** Enregistre ou partage le fichier de sauvegarde : téléchargement sur le web, feuille de partage sur mobile. */
export async function exportBackupFile(text: string, filename: string): Promise<ExportOutcome> {
  try {
    if (Platform.OS === 'web') {
      const g = globalThis as unknown as {
        Blob: new (parts: string[], options: { type: string }) => unknown;
        URL: { createObjectURL(b: unknown): string; revokeObjectURL(u: string): void };
        document: { createElement(tag: string): { href: string; download: string; click(): void; remove(): void }; body: { appendChild(n: unknown): void } };
      };
      const url = g.URL.createObjectURL(new g.Blob([text], { type: 'application/json' }));
      const a = g.document.createElement('a');
      a.href = url;
      a.download = filename;
      g.document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => g.URL.revokeObjectURL(url), 4000);
      return 'downloaded';
    }
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(text);
    if (!(await Sharing.isAvailableAsync())) return 'failed';
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Sauvegarde Zeno' });
    return 'shared';
  } catch {
    return 'failed';
  }
}

export type PickOutcome =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: 'cancelled' | 'too_big' | 'unreadable' };

/** Choisit un fichier JSON et renvoie son contenu (15 Mo maximum). */
export async function pickBackupText(): Promise<PickOutcome> {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
    if (res.canceled) return { ok: false, reason: 'cancelled' };
    const asset = res.assets[0];
    if (!asset) return { ok: false, reason: 'cancelled' };
    if (typeof asset.size === 'number' && asset.size > IMPORT_MAX_BYTES) return { ok: false, reason: 'too_big' };
    const response = await fetch(asset.uri);
    const text = await response.text();
    if (text.length > IMPORT_MAX_BYTES) return { ok: false, reason: 'too_big' };
    return { ok: true, text };
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}
