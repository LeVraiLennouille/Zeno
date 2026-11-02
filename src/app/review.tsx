import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HabitBadge } from '@/components/ui/HabitBadge';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { isDateKey, lastWeekMonday, mondayLabel, reviewModel } from '@/domain';
import { copyText } from '@/services/clipboard';
import { notify } from '@/services/toast';
import { useCtx } from '@/state/react';
import { useTheme } from '@/theme';

/** Bilan d'une semaine (la précédente par défaut). */
export default function ReviewScreen() {
  const { mon } = useLocalSearchParams<{ mon?: string }>();
  const router = useRouter();
  const ctx = useCtx();
  const { colors } = useTheme();
  const monday = isDateKey(mon) ? mon : lastWeekMonday(ctx);
  const m = useMemo(() => reviewModel(ctx, monday), [ctx, monday]);

  const copy = async (): Promise<void> => {
    const ok = await copyText(m.summary);
    notify(ok ? 'Résumé copié' : 'Copie impossible sur cet appareil', ok ? 'star' : 'alert', ok ? 2200 : 3000);
  };
  const deltaColor = m.delta?.sign === '+' ? colors.success : m.delta?.sign === '−' ? colors.danger : colors.text2;

  return (
    <ModalScreen title={`Bilan · ${mondayLabel(monday)}`}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <AppText
          variant="hero"
          accessibilityLabel={`Score de la semaine : ${m.score == null ? 'indisponible' : `${m.score} pour cent`}`}
          style={{ fontSize: 96, lineHeight: 96 }}
        >
          {m.score ?? '–'}
          <AppText variant="title" tone="text2">
            %
          </AppText>
        </AppText>
        {m.delta ? (
          <AppText variant="bodyStrong" style={{ color: deltaColor }}>
            {m.delta.sign}
            {m.delta.pts} pts <AppText variant="caption" tone="text2">vs semaine précédente</AppText>
          </AppText>
        ) : null}
        <AppText variant="heading" style={{ textAlign: 'center' }}>
          {m.verdict}
        </AppText>
        <AppText tone="text2">{m.sub}</AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {m.tiles.map((t) => (
          <Card key={t.label} shadow={false} style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 2 }}>
            <AppText variant="title" accessibilityElementsHidden>
              {t.icon}
            </AppText>
            <AppText variant="heading" style={{ textAlign: 'center' }}>
              {t.value}
            </AppText>
            <AppText variant="caption" tone="text2" style={{ textAlign: 'center' }}>
              {t.label}
            </AppText>
          </Card>
        ))}
      </View>

      <Card shadow={false} style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppText variant="title">{m.season.emoji}</AppText>
          <View>
            <AppText variant="caption" tone="text2">
              {m.season.label}
            </AppText>
            <AppText variant="heading">{m.season.rank}</AppText>
          </View>
        </View>
        <ProgressBar pct={m.season.pct} label="Progression vers le rang suivant" />
        <AppText variant="caption" tone="text2">
          {m.season.foot}
        </AppText>
      </Card>

      <View style={{ gap: 10 }}>
        <AppText variant="label" tone="text3">
          À retravailler
        </AppText>
        {m.forgotten ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <HabitBadge habit={m.forgotten.habit} size={40} />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{m.forgotten.habit.name}</AppText>
              <AppText variant="caption" tone="text2">
                {m.forgotten.detail}
              </AppText>
            </View>
            {m.forgotten.canChallenge ? (
              <Button
                label="Lancer un défi"
                variant="outline"
                style={{ minHeight: 40, paddingHorizontal: 12 }}
                onPress={() => {
                  router.replace({ pathname: '/challenge/new', params: { habit: m.forgotten?.habit.id ?? '' } });
                }}
              />
            ) : null}
          </View>
        ) : (
          <AppText tone="text2">{m.emptyForgotten}</AppText>
        )}
        {m.bestDay ? (
          <AppText>
            Meilleur jour : <AppText variant="bodyStrong">{m.bestDay.day}</AppText> · {m.bestDay.pct} %
          </AppText>
        ) : null}
      </View>

      <Button label="C’est reparti pour la semaine" onPress={() => router.back()} />
      <Button label="Copier le résumé" variant="outline" onPress={() => void copy()} />
    </ModalScreen>
  );
}
