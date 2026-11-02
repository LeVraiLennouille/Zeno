import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DateStepper } from '@/components/ui/DateStepper';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { pauseFormModel, pausePreset, setPauseField, startPauseForm, type PauseFormState } from '@/domain';
import { pauseErrorMessage } from '@/i18n/messages';
import { Icon } from '@/icons/Icon';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react';
import { useTheme } from '@/theme';

export default function PauseScreen() {
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const { colors } = useTheme();
  const [form, setForm] = useState<PauseFormState>(() => startPauseForm(ctx));
  const model = pauseFormModel(ctx, form);

  const save = (): void => {
    const r = store.savePause(form);
    if (!r.ok) {
      notify(pauseErrorMessage(r.error), 'alert', 3500);
      return;
    }
    router.back();
    notify(`Pause enregistrée · ${r.value} jour${r.value > 1 ? 's' : ''}`, 'moon', 2800);
  };

  return (
    <ModalScreen title="Poser une pause">
      <AppText tone="text2">
        Une pause gèle tes séries : ces jours ne comptent ni comme réussis, ni comme manqués.
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Aujourd’hui" selected={false} onPress={() => setForm((f) => pausePreset(ctx, 'today', f))} />
        <Chip label="Hier" selected={false} onPress={() => setForm((f) => pausePreset(ctx, 'yesterday', f))} />
      </View>
      <DateStepper label="Du" value={form.from} min={model.bounds.min} max={model.bounds.max} onChange={(d) => setForm((f) => setPauseField(f, 'from', d))} />
      <DateStepper label="Au" value={form.to} min={model.bounds.min} max={model.bounds.max} onChange={(d) => setForm((f) => setPauseField(f, 'to', d))} />

      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Raison
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {model.reasons.map((r) => (
            <Chip key={r.id} label={`${r.emoji} ${r.label}`} selected={form.reason === r.id} onPress={() => setForm((f) => ({ ...f, reason: r.id }))} />
          ))}
        </View>
      </View>

      <AppText variant="bodyStrong" tone={model.status.ok ? 'success' : 'danger'} accessibilityLiveRegion="polite">
        {model.status.text}
      </AppText>
      <Button label="Poser la pause" disabled={!model.status.ok} onPress={save} />

      {model.recent.length > 0 ? (
        <View style={{ gap: 8 }}>
          <AppText variant="label" tone="text3">
            Pauses récentes et à venir
          </AppText>
          {model.recent.map((r) => (
            <View key={r.date} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <AppText>
                {r.emoji} {r.label} · {r.reason}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Retirer la pause du ${r.date}`}
                hitSlop={8}
                onPress={() => {
                  store.removePause(r.date);
                  notify('Pause annulée', 'moon', 2200);
                }}
              >
                <Icon name="trash" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ModalScreen>
  );
}
