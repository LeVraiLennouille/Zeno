import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { challengesModel, fmtNum, type ChallengeCardModel, type ChallengeHistoryRow, type SeasonCardModel } from '@/domain';
import { confirmAsync } from '@/services/confirm';
import { notify } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

export function SeasonCard({ season }: { readonly season: SeasonCardModel }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="title">{season.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="text2">
            Saison · {season.label}
          </AppText>
          <AppText variant="title">
            Rang {season.roman} <AppText variant="heading" tone="text2">{season.rankName}</AppText>
          </AppText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <AppText variant="title">{season.daysLeft}</AppText>
          <AppText variant="caption" tone="text2">
            jour{season.daysLeft > 1 ? 's' : ''} restant{season.daysLeft > 1 ? 's' : ''}
          </AppText>
        </View>
      </View>
      <View style={{ marginVertical: 12 }}>
        <ProgressBar pct={season.pct} label="Progression vers le rang suivant" />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <AppText variant="caption" tone="text2">
          {fmtNum(season.xp)} XP cette saison
        </AppText>
        <AppText variant="caption" tone="text2" style={{ flexShrink: 1, textAlign: 'right' }}>
          {season.footRight}
        </AppText>
      </View>
      {season.past.length > 0 ? (
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: colors.border, gap: 6 }}>
          <AppText variant="label" tone="text3">
            Saisons passées
          </AppText>
          {season.past.map((p) => (
            <View key={p.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <AppText variant="caption">
                {p.emoji} {p.label}
              </AppText>
              <AppText variant="caption" tone="text2">
                Rang {p.roman} · {p.rankName} · {fmtNum(p.xp)} XP
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function ChallengeCard({ c, onAbandon }: { readonly c: ChallengeCardModel; readonly onAbandon: () => void }) {
  const { colors } = useTheme();
  return (
    <Card shadow={false} style={{ borderColor: c.color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="title">{c.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="heading" numberOfLines={2}>
            {c.title}
          </AppText>
          <AppText variant="caption" tone="text2">
            {c.sub}
          </AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Abandonner le défi ${c.title}`} hitSlop={10} onPress={onAbandon}>
          <AppText variant="heading" tone="text2">
            ✕
          </AppText>
        </Pressable>
      </View>
      <View style={{ marginVertical: 12 }}>
        <ProgressBar pct={c.pct} color={c.color} label={c.title} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" style={{ color: colors.text }}>
          <AppText variant="bodyStrong">{c.success}</AppText> / {c.required} jours
        </AppText>
        <AppText variant="caption" tone="text2">
          +{c.reward} XP à la clé
        </AppText>
      </View>
    </Card>
  );
}

function HistoryRow({ row }: { readonly row: ChallengeHistoryRow }) {
  const { colors } = useTheme();
  const tone = row.tone === 'ok' ? colors.success : row.tone === 'ko' ? colors.danger : colors.text3;
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <AppText variant="heading" style={{ color: tone, width: 22, textAlign: 'center' }}>
        {row.glyph}
      </AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {row.emoji} {row.title}
        </AppText>
        <AppText variant="caption" tone="text2">
          {row.sub}
        </AppText>
      </View>
    </View>
  );
}

export function ChallengesTab() {
  const store = useStore();
  const m = useModel(challengesModel);

  const abandon = async (c: ChallengeCardModel): Promise<void> => {
    const ok = await confirmAsync('Abandonner ce défi ?', `« ${c.title} » sera marqué comme abandonné.`, 'Abandonner', true);
    if (!ok) return;
    store.abandonChallenge(c.id);
    notify('Défi abandonné', 'trash', 2200);
  };
  const clear = async (): Promise<void> => {
    if (await confirmAsync('Effacer l’historique des défis terminés ?', 'Les défis en cours sont conservés.', 'Effacer', true)) {
      store.clearChallengeHistory();
    }
  };

  return (
    <View style={{ gap: 20 }}>
      <SeasonCard season={m.season} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AppText variant="heading">Défis en cours</AppText>
          <Link href="/challenge/new" asChild>
            <Button label="+ Nouveau défi" variant="outline" disabled={m.atMax} style={{ minHeight: 40, paddingHorizontal: 14 }} />
          </Link>
        </View>
        {m.active.length > 0 ? (
          <View style={{ gap: 12 }}>
            {m.active.map((c) => (
              <ChallengeCard key={c.id} c={c} onAbandon={() => void abandon(c)} />
            ))}
          </View>
        ) : (
          <AppText tone="text2">
            Lance-toi un défi : « 30 jours sans scroller », « Gym 12 fois en 30 jours »… Chaque défi relevé rapporte de l’XP de saison et des succès.
          </AppText>
        )}
        {m.atMax ? (
          <AppText variant="caption" tone="text2">
            Maximum 5 défis en cours.
          </AppText>
        ) : null}
      </View>

      {m.history.length > 0 ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="heading">
              Historique · {m.wonCount} relevé{m.wonCount > 1 ? 's' : ''}
            </AppText>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void clear()}>
              <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                Effacer
              </AppText>
            </Pressable>
          </View>
          {m.history.map((h) => (
            <HistoryRow key={h.id} row={h} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
