import { useMemo } from 'react';

import { HabitFormView } from '@/components/habit/HabitFormView';
import { emptyHabitForm } from '@/domain';
import { useStore } from '@/state/react';

export default function NewHabitScreen() {
  const store = useStore();
  // Le formulaire démarre sur la base du moment de l'ouverture (couleur libre proposée).
  const initial = useMemo(() => emptyHabitForm(store.getState().db), [store]);
  return <HabitFormView initial={initial} />;
}
