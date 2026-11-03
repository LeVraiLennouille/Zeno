import { useEffect } from 'react';

import { feedbackPorts } from '@/services/feedbackPorts';
import { systemTimers } from '@/services/timers';
import { runFeedback } from '@/state';
import { useStore } from '@/state/react/StoreProvider';

/** Relie les événements du domaine aux sons, vibrations, toasts et confettis. */
export function useFeedbackWiring(): void {
  const store = useStore();
  useEffect(
    () =>
      store.subscribeFeedback((items) =>
        runFeedback(items, feedbackPorts, {
          soundEnabled: store.getState().db.profile.soundEnabled,
          timers: systemTimers,
        }),
      ),
    [store],
  );
}
