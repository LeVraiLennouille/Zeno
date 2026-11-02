import { useEffect } from 'react';
import { Platform } from 'react-native';

interface KeyTarget {
  addEventListener(type: 'keydown', listener: (event: { key: string }) => void): void;
  removeEventListener(type: 'keydown', listener: (event: { key: string }) => void): void;
}

/** Version web : la touche Échap ferme la feuille (équivalent du geste « retour » sur mobile). */
export function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const target = globalThis as unknown as KeyTarget;
    const onKey = (event: { key: string }): void => {
      if (event.key === 'Escape') onClose();
    };
    target.addEventListener('keydown', onKey);
    return () => target.removeEventListener('keydown', onKey);
  }, [onClose]);
}
