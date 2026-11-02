import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { TextField } from '@/components/ui/TextField';
import {
  feelingsFor,
  fmtDay,
  isDateKey,
  isMoodValue,
  JOURNAL_MAX,
  MOOD_EMOJIS,
  MOOD_LABELS,
  MOOD_VALUES,
  savedFeelings,
  today,
  type DateKey,
  type MoodValue,
} from '@/domain';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react';
import { useTheme } from '@/theme';

/** Humeur en deux étapes : on choisit l'humeur, puis ressentis et note facultative. */
export default function MoodScreen() {
  const params = useLocalSearchParams<{ date?: string; step?: string }>();
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const { colors } = useTheme();

  const date: DateKey = isDateKey(params.date) ? params.date : today(ctx);
  const existing = ctx.db.moods[date];
  const [mood, setMood] = useState<MoodValue | null>(existing ?? null);
  const [step, setStep] = useState<1 | 2>(existing !== undefined && params.step === '2' ? 2 : 1);
  const [feelings, setFeelings] = useState<readonly string[]>(existing !== undefined ? savedFeelings(ctx.db, date, existing) : []);
  const [note, setNote] = useState(ctx.db.journal[date] ?? '');

  const isToday = date === today(ctx);
  const title = isToday ? 'Comment te sens-tu ?' : `Comment te sentais-tu le ${fmtDay(date)} ?`;

  const choose = (m: MoodValue): void => {
    setMood(m);
    setFeelings(savedFeelings(ctx.db, date, m));
  };
  const toggleFeeling = (f: string): void => setFeelings((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const save = (): void => {
    if (!isMoodValue(mood)) return;
    const r = store.saveMood({ date, value: mood, feelings, journal: note });
    if (!r.ok) {
      notify('Impossible d’enregistrer cette humeur', 'alert', 2800);
      return;
    }
    router.back();
    notify(`Humeur enregistrée ${MOOD_EMOJIS[mood]}${r.value.hasNote ? ' · note ajoutée' : ''}`, 'star', 2200);
  };

  return (
    <ModalScreen title={step === 1 ? title : `${MOOD_LABELS[mood ?? 3]} ! Comment décris-tu ton ressenti ?`}>
      {step === 1 ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {MOOD_VALUES.map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityLabel={MOOD_LABELS[v]}
                accessibilityState={{ selected: mood === v }}
                onPress={() => choose(v)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 2.5,
                  alignItems: 'center',
                  gap: 6,
                  borderColor: mood === v ? colors.text : colors.border,
                  backgroundColor: mood === v ? colors.accentBg : colors.surface,
                }}
              >
                <AppText variant="title">{MOOD_EMOJIS[v]}</AppText>
                <AppText variant="caption" tone="text2">
                  {MOOD_LABELS[v]}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Button
            label={mood ? `Je me sens ${MOOD_LABELS[mood].toLowerCase()}` : 'Je me sens…'}
            disabled={!mood}
            onPress={() => setStep(2)}
          />
        </>
      ) : mood ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {feelingsFor(mood).map((f) => (
              <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />
            ))}
          </View>
          <TextField label={`Une note pour ce jour ? (${note.length}/${JOURNAL_MAX})`} value={note} onChangeText={setNote} maxLength={JOURNAL_MAX} multiline placeholder="Facultatif" />
          <Button label="Valider" onPress={save} />
          <Button label="Retour" variant="outline" onPress={() => setStep(1)} />
        </>
      ) : null}
    </ModalScreen>
  );
}
