import { useEffect } from 'react';

import { planNotifications } from '@/domain';
import { cancelAllNotifications, syncNotifications } from '@/services/notifications';
import { useStore } from '@/state/react/StoreProvider';
import { useAppState } from '@/state/react/StoreProvider';

/**
 * Garde les notifications programmées à jour : après chaque changement de rappel, d'habitude
 * cochée (un rappel déjà satisfait est omis), de réglage ou de jour.
 */
export function useNotificationSync(): void {
  const store = useStore();
  const { db, revision, hydrated } = useAppState();
  const enabled = db.profile.notifsEnabled;

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => {
      if (!enabled) void cancelAllNotifications();
      else void syncNotifications(planNotifications(store.ctx));
    }, 800);
    return () => clearTimeout(id);
  }, [store, hydrated, enabled, db.reminders, db.habits, db.habitDefs, revision]);
}
