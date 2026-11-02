import * as Clipboard from 'expo-clipboard';

/** Copie un texte ; renvoie `false` si l'appareil ou le navigateur refuse. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
