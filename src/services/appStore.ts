import Constants from 'expo-constants';

import { systemClock } from '@/domain';
import { AppStore } from '@/state';

import { asyncStorageAdapter } from './asyncStorage';
import { makeId } from './ids';
import { legacySource } from './legacy';
import { systemTimers } from './timers';

/** Instance unique de l'application. */
export const appStore = new AppStore({
  storage: asyncStorageAdapter,
  clock: systemClock,
  timers: systemTimers,
  newId: makeId,
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  ...(legacySource ? { legacy: legacySource } : {}),
});
