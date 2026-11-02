/** Stockage clé/valeur asynchrone (AsyncStorage sur mobile, localStorage sur le web). */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Stockage en mémoire : tests et repli quand aucun stockage n'est disponible. */
export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter & {
  readonly data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => Promise.resolve(data.get(k) ?? null),
    setItem: (k, v) => {
      data.set(k, v);
      return Promise.resolve();
    },
    removeItem: (k) => {
      data.delete(k);
      return Promise.resolve();
    },
  };
}
