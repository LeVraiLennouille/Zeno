import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StorageAdapter } from '@/state';

/** Stockage persistant : fichiers sur mobile, `localStorage` sur le web. */
export const asyncStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
