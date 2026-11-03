import { View } from 'react-native';

import { f1, INSIGHT_DAYS, insightsModel, type RichText } from '@/domain';
import { useModel } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { ProgressBar } from '../ui/ProgressBar';

export function RichLine({ parts, variant = 'body' }: { readonly parts: readonly RichText[]; readonly variant?: 'body' | 'caption' }) {
  return (
    <AppText variant={variant}>
      {parts.map((p, i) =>
        p.bold ? (
          <AppText key={i} variant="bodyStrong">
            {p.text}
          </AppText>
        ) : (
          p.text
        ),
      )}
    </AppText>
  );
}

/** Corrélations humeur / habitudes / sommeil sur 90 jours (« corrélations, pas causes »). */
export function InsightsCard() {
  const m = useModel(insightsModel);
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {!m.enough ? (
        <View style={{ gap: 8 }}>
          <AppText tone="text2">Il faut au moins 7 jours d’humeur renseignée pour dégager des tendances.</AppText>
          <ProgressBar pct={Math.round((m.daysWithMood / 7) * 100)} label="Jours d’humeur renseignés" />
          <AppText variant="caption" tone="text2">
            {m.daysWithMood} / 7 jours
          </AppText>
        </View>
      ) : (
        <>
          <AppText>
            Humeur moyenne : <AppText variant="bodyStrong">{f1(m.averageMood ?? 0)}</AppText> / 5 sur {m.daysWithMood} jours renseignés
          </AppText>
          {m.items.length === 0 ? (
            <AppText tone="text2">Rien de marquant pour l’instant. Continue à renseigner ton humeur : les tendances apparaissent avec le temps.</AppText>
          ) : (
            m.items.map((i, n) => (
              <View key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <AppText variant="title" accessibilityElementsHidden>
                  {i.icon}
                </AppText>
                <View style={{ flex: 1, gap: 2 }}>
                  <RichLine parts={i.parts} />
                  <AppText variant="caption" tone="text3">
                    sur {i.n} jours
                  </AppText>
                </View>
                {i.delta ? (
                  <AppText variant="bodyStrong" style={{ color: i.good ? colors.success : colors.danger }}>
                    {i.delta}
                  </AppText>
                ) : null}
              </View>
            ))
          )}
        </>
      )}
      <AppText variant="caption" tone="text3">
        Ce sont des corrélations, pas des causes. · {INSIGHT_DAYS} derniers jours
      </AppText>
    </View>
  );
}
