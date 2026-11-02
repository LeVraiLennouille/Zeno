import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import type { Ctx } from '../../domain';
import type { AppState, AppStore } from '../store';

const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ store, children }: { readonly store: AppStore; readonly children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore() doit être appelé sous <StoreProvider>.');
  return store;
}

/** État complet ; le composant se re-rend à chaque changement de la base ou de la révision. */
export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Contexte de lecture du domaine (base + horloge), stable tant que rien ne change. */
export function useCtx(): Ctx {
  const store = useStore();
  const { db, revision } = useAppState();
  // `revision` change quand le temps passe sans que `db` change (minuit) : il force le recalcul.
  return useMemo(() => ({ db, clock: store.clock }), [db, store, revision]);
}

/** Calcule un modèle d'écran du domaine ; `model` doit être une fonction stable (définie hors composant). */
export function useModel<T>(model: (ctx: Ctx) => T): T {
  const ctx = useCtx();
  return useMemo(() => model(ctx), [model, ctx]);
}
