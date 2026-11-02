import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import {
  DOW_LETTER,
  DOW_ORDER,
  emptyReminderForm,
  reminderDaysPreset,
  reminderHabitOptions,
  reminderToForm,
  toggleReminderDay,
  type ReminderError,
  type ReminderForm,
} from '@/domain';
import { confirmAsync } from '@/services/confirm';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react';

const ERRORS: Readonly<Record<ReminderError, string>> = {
  title_required: 'Donne un titre au rappel',
  bad_time: 'Choisis une heure valide',
  no_day: 'Choisis au moins un jour',
};

/** Création (`/reminder/new`) et modification d'un rappel. */
export default function ReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const initial = useMemo<ReminderForm>(() => {
    const existing = ctx.db.reminders.find((r) => r.id === id);
    return existing ? reminderToForm(existing) : emptyReminderForm();
    // Le formulaire démarre sur l'état à l'ouverture et n'est plus réinitialisé ensuite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const [form, setForm] = useState<ReminderForm>(initial);
  const patch = (p: Partial<ReminderForm>): void => setForm((f) => ({ ...f, ...p }));

  const save = (): void => {
    const r = store.saveReminder(form);
    if (!r.ok) {
      notify(ERRORS[r.error], 'alert', 3000);
      return;
    }
    router.back();
    notify(r.value.created ? 'Rappel ajouté' : 'Rappel mis à jour', 'bell', 2400);
  };

  const remove = async (): Promise<void> => {
    if (!form.id) return;
    if (!(await confirmAsync('Supprimer ce rappel ?', `« ${form.title} » sera supprimé.`, 'Supprimer', true))) return;
    store.deleteReminder(form.id);
    router.back();
    notify('Rappel supprimé', 'trash', 2200);
  };

  return (
    <ModalScreen title={form.mode === 'create' ? 'Nouveau rappel' : 'Modifier le rappel'}>
      <TextField label="Titre" value={form.title} onChangeText={(title) => patch({ title })} maxLength={40} placeholder="Ex. 💊 Vitamines" />
      <TextField label="Message (facultatif)" value={form.body} onChangeText={(body) => patch({ body })} maxLength={80} />
      <TextField label="Heure (HH:MM)" value={form.time} onChangeText={(time) => patch({ time })} maxLength={5} keyboardType="number-pad" placeholder="09:00" />

      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Jours
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DOW_ORDER.map((d) => (
            <Chip key={d} label={DOW_LETTER[d] ?? ''} selected={form.days.includes(d)} onPress={() => setForm((f) => toggleReminderDay(f, d))} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Tous les jours" selected={false} onPress={() => setForm((f) => reminderDaysPreset(f, 'all'))} />
          <Chip label="Lun - Ven" selected={false} onPress={() => setForm((f) => reminderDaysPreset(f, 'week'))} />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Habitude liée
        </AppText>
        <AppText variant="caption" tone="text2">
          Le rappel est ignoré le jour où l’habitude est déjà faite.
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Aucune" selected={form.habitId === ''} onPress={() => patch({ habitId: '' })} />
          {reminderHabitOptions(ctx).map((h) => (
            <Chip key={h.id} label={`${h.emoji} ${h.name}`} selected={form.habitId === h.id} onPress={() => patch({ habitId: h.id })} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="bodyStrong">Rappel actif</AppText>
        <Toggle label="Rappel actif" value={form.enabled} onChange={(enabled) => patch({ enabled })} />
      </View>

      <Button label="Enregistrer" onPress={save} />
      {form.mode === 'edit' ? <Button label="Supprimer" variant="danger" onPress={() => void remove()} /> : null}
    </ModalScreen>
  );
}
