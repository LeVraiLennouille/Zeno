import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AddHabitButton } from '@/components/habit/AddHabitButton';
import { EmptyNote } from '@/components/habit/EmptyNote';
import { MyHabitRowView } from '@/components/habit/MyHabitRow';
import { ReorderRow } from '@/components/habit/ReorderRow';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { HabitBadge } from '@/components/ui/HabitBadge';
import { Screen } from '@/components/ui/Screen';
import { archivedModel, fmtDay, myHabitsModel, type ArchivedRow } from '@/domain';
import { Icon } from '@/icons/Icon';
import { confirmAsync } from '@/services/confirm';
import { notify, notifyUndo } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

function ArchivedList({ rows }: { readonly rows: readonly ArchivedRow[] }) {
  const store = useStore();
  const { colors } = useTheme();
  if (rows.length === 0) return null;

  const purge = async (row: ArchivedRow): Promise<void> => {
    const { habit } = row;
    const ok = await confirmAsync(
      'Supprimer définitivement ?',
      `« ${habit.name} » et tout son historique seront effacés (tu pourras annuler quelques secondes).`,
      'Supprimer',
      true,
    );
    if (!ok) return;
    const undo = store.purgeHabit(habit.id);
    if (undo) notifyUndo(`« ${habit.name} » supprimée`, () => {
      store.undoPurge(undo);
      notify('Habitude rétablie', 'star', 2400);
    });
  };

  return (
    <View style={{ gap: 10, marginTop: 24 }}>
      <AppText variant="label" tone="text3">
        Archivées
      </AppText>
      {rows.map((row) => (
        <View
          key={row.habit.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 12, borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <HabitBadge habit={row.habit} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="heading" numberOfLines={1}>
              {row.habit.name}
            </AppText>
            <AppText variant="caption" tone="text2">
              {row.archivedOn ? `Archivée le ${fmtDay(row.archivedOn)} · ` : ''}meilleure série {row.bestStreak}
            </AppText>
          </View>
          <Button
            label="Restaurer"
            variant="outline"
            style={{ minHeight: 40, paddingHorizontal: 12 }}
            onPress={() => {
              if (store.restoreHabit(row.habit.id)) notify(`« ${row.habit.name} » restaurée`, 'star', 2600);
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Supprimer définitivement ${row.habit.name}`}
            hitSlop={8}
            onPress={() => void purge(row)}
          >
            <Icon name="trash" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default function HabitsScreen() {
  const store = useStore();
  const rows = useModel(myHabitsModel);
  const archived = useModel(archivedModel);
  const [reorder, setReorder] = useState(false);
  const editing = reorder && rows.length > 0;

  return (
    <>
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <AppText variant="title">Mes habitudes</AppText>
          {rows.length > 1 ? (
            <Button
              label={editing ? 'Terminé' : 'Réorganiser'}
              variant="outline"
              style={{ minHeight: 40, paddingHorizontal: 14 }}
              onPress={() => setReorder((v) => !v)}
            />
          ) : null}
        </View>

        {rows.length === 0 ? (
          <EmptyNote text="Aucune habitude pour l'instant. Appuie sur + pour créer la première." />
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {rows.map((row, i) =>
              editing ? (
                <ReorderRow key={row.habit.id} row={row} position={i + 1} total={rows.length} onMove={(d) => store.moveHabit(row.habit.id, d)} />
              ) : (
                <MyHabitRowView key={row.habit.id} row={row} />
              ),
            )}
          </View>
        )}
        <ArchivedList rows={archived} />
      </Screen>
      {editing ? null : <AddHabitButton />}
    </>
  );
}
