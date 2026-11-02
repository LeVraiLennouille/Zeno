import { useEffect } from 'react';
import { AppState } from 'react-native';

import { today } from '@/domain';
import { useStore } from '@/state/react';

/**
 * Cycle de vie : sauvegarde quand l'app passe en arrière-plan, recalcul au retour au
 * premier plan et au changement de jour (vérifié chaque minute, y compris pendant que
 * l'app reste ouverte).
 */
export function useAppLifecycle(): void {
  const store = useStore();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') store.refresh();
      else void store.flush();
    });
    return () => sub.remove();
  }, [store]);

  useEffect(() => {
    let current = today(store.ctx);
    const id = setInterval(() => {
      const now = today(store.ctx);
      if (now !== current) {
        current = now;
        store.refresh();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [store]);
}
