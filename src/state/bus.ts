/** Petit bus d'événements typé (toasts, confettis, animations) sans dépendance. */
export interface Bus<T> {
  emit(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
}

export function createBus<T>(): Bus<T> {
  const listeners = new Set<(value: T) => void>();
  return {
    emit: (value) => {
      for (const l of [...listeners]) l(value);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
