import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { HabitFormView } from '@/components/habit/HabitFormView';
import { habitToForm } from '@/domain';
import { useStore } from '@/state/react';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const habit = store.getState().db.habitDefs.find((h) => h.id === id);
  const initial = useMemo(() => (habit ? habitToForm(habit) : null), [habit?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!initial) return <Redirect href="/habits" />;
  return <HabitFormView key={initial.id ?? 'new'} initial={initial} />;
}
