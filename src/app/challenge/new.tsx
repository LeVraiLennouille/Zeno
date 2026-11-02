import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { TextField } from '@/components/ui/TextField';
import {
  CHAL_DURATIONS,
  challengeCandidates,
  challengePreview,
  clampChallengeDays,
  startChallengeForm,
  type ChallengeFormState,
} from '@/domain';
import { CHALLENGE_ERRORS } from '@/i18n/messages';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react';

export default function NewChallengeScreen() {
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const { habit } = useLocalSearchParams<{ habit?: string }>();
  const [form, setForm] = useState<ChallengeFormState | null>(() => {
    const start = startChallengeForm(ctx);
    if (!start.ok) return null;
    // Habitude proposée par le bilan hebdomadaire, si elle est éligible.
    const wanted = habit && challengeCandidates(ctx).some((h) => h.id === habit) ? habit : null;
    return wanted ? { ...start.form, habitId: wanted } : start.form;
  });

  // Aucun défi possible : on prévient et on referme (comme la PWA).
  useEffect(() => {
    if (form) return;
    const start = startChallengeForm(ctx);
    if (!start.ok) {
      notify(start.reason === 'max_active' ? 'Maximum 5 défis en cours' : 'Toutes tes habitudes ont déjà un défi en cours', 'alert', 3000);
      router.back();
    }
  }, [form, ctx, router]);

  if (!form) return null;
  const patch = (p: Partial<ChallengeFormState>): void => setForm((f) => (f ? { ...f, ...p } : f));
  const preview = challengePreview(ctx, form);
  if (!preview) return null;
  const candidates = challengeCandidates(ctx);

  const launch = (): void => {
    const r = store.createChallenge({
      habitId: form.habitId,
      days: form.days,
      mode: form.mode,
      min: form.min,
      title: form.titleTouched ? form.title : '',
    });
    if (!r.ok) {
      notify(CHALLENGE_ERRORS[r.error], 'alert', 3200);
      return;
    }
    router.back();
    notify('Défi lancé : bon courage !', 'trophy', 2600);
  };

  return (
    <ModalScreen title="Nouveau défi">
      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Habitude
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {candidates.map((h) => (
            <Chip
              key={h.id}
              label={`${h.emoji} ${h.name}${h.type === 'bad' ? ' (à éviter)' : ''}`}
              selected={form.habitId === h.id}
              onPress={() => patch({ habitId: h.id, ...(h.type === 'bad' ? { mode: 'all' as const } : {}) })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Durée
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CHAL_DURATIONS.map((d) => (
            <Chip key={d} label={String(d)} selected={form.days === d} onPress={() => patch({ days: d })} />
          ))}
        </View>
        <TextField label="jours, à partir d’aujourd’hui · autre durée (3 à 365)" value={String(form.days)} keyboardType="number-pad" maxLength={3} onChangeText={(t) => patch({ days: clampChallengeDays(t, form.days) })} />
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="label" tone="text3">
          Objectif
        </AppText>
        {preview.isBad ? (
          <AppText>Aucun écart pendant {form.days} jours.</AppText>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Tous les jours" selected={form.mode === 'all'} onPress={() => patch({ mode: 'all' })} />
              <Chip label="Un minimum de jours" selected={form.mode === 'min'} onPress={() => patch({ mode: 'min' })} />
            </View>
            {form.mode === 'min' ? (
              <TextField label={`Jours à réussir sur ${form.days} (max ${preview.activeDays})`} value={String(form.min)} keyboardType="number-pad" maxLength={3} onChangeText={(t) => patch({ min: parseInt(t, 10) || 1 })} />
            ) : null}
          </>
        )}
        <AppText variant="caption" tone="text2">
          {preview.requiredDays} jour{preview.requiredDays > 1 ? 's' : ''} à réussir · +{preview.reward} XP à la clé
        </AppText>
      </View>

      <TextField label="Titre" value={preview.title} maxLength={50} onChangeText={(t) => patch({ title: t, titleTouched: true })} />
      <Button label="Lancer le défi" onPress={launch} />
    </ModalScreen>
  );
}
