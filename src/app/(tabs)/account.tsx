import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PrefRow } from '@/components/ui/PrefRow';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BackupSection } from '@/components/account/BackupSection';
import { RemindersSection } from '@/components/account/RemindersSection';
import { Screen } from '@/components/ui/Screen';
import { Toggle } from '@/components/ui/Toggle';
import { accountModel, dayStartHint, dayStartLabel, pauseSectionModel, seasonCardModel, type ThemeMode } from '@/domain';
import { Icon } from '@/icons/Icon';
import { confirmAsync } from '@/services/confirm';
import { notify } from '@/services/toast';
import { useModel, useStore } from '@/state/react';
import { radius, useTheme } from '@/theme';

const THEME_OPTIONS: readonly { readonly id: ThemeMode; readonly label: string }[] = [
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
  { id: 'system', label: 'Auto' },
];
const HOURS = [0, 1, 2, 3, 4, 5, 6] as const;

export default function AccountScreen() {
  const store = useStore();
  const { colors } = useTheme();
  const m = useModel(accountModel);
  const pause = useModel(pauseSectionModel);
  const season = useModel(seasonCardModel);
  const { prefs } = m;

  const reset = async (): Promise<void> => {
    const ok = await confirmAsync(
      'Tout effacer ?',
      'Cette action supprime définitivement TOUTES tes données et ne peut pas être annulée. Veux-tu vraiment tout effacer ?',
      'Tout effacer',
      true,
    );
    if (ok) await store.resetAll();
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: 6 }}>
        <Link href="/avatar" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Changer l’avatar"
            style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2.5, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 42 }}>{m.avatar}</Text>
          </Pressable>
        </Link>
        <AppText variant="title">{m.name}</AppText>
        <AppText variant="caption" tone="text2">
          Niv. {m.level} — {m.levelName}
        </AppText>
      </Card>

      <Card padded shadow={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <AppText variant="bodyStrong">Expérience</AppText>
          <AppText variant="bodyStrong">
            {m.xp} XP · {m.xpProgress.needed > 0 ? `encore ${m.xpProgress.needed}` : 'niveau max'}
          </AppText>
        </View>
        <ProgressBar pct={m.xpProgress.pct} label="Progression vers le niveau suivant" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 }}>
          <AppText variant="bodyStrong">
            {season.emoji} {season.label}
          </AppText>
          <AppText variant="bodyStrong">
            Rang {season.roman} · {season.rankName}
          </AppText>
        </View>
        <ProgressBar pct={season.pct} label="Progression de la saison" />
      </Card>

      <View style={{ gap: 8, marginTop: 8 }}>
        <AppText variant="label" tone="text3">
          Préférences
        </AppText>
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' }}>
          <PrefRow icon={<Icon name="edit" size={20} color={colors.text2} />} label="Nom d'affichage" hint={m.name}>
            <Link href="/profile" asChild>
              <Button label="Modifier" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} />
            </Link>
          </PrefRow>

          <PrefRow icon={<Icon name="moon" size={20} color={colors.text2} />} label="Thème" hint="Clair, sombre ou selon l'appareil">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {THEME_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={prefs.themeMode === o.id} onPress={() => store.setThemeMode(o.id)} />
              ))}
            </View>
          </PrefRow>

          <PrefRow icon={<Icon name="volume" size={20} color={colors.text2} />} label="Effets sonores" hint="Retour sonore à chaque action">
            <Toggle label="Effets sonores" value={prefs.soundEnabled} onChange={() => store.togglePref('sound')} />
          </PrefRow>

          <PrefRow icon={<Icon name="zen" size={20} color={colors.text2} />} label="Mode zen" hint="Les habitudes terminées se replient">
            <Toggle label="Mode zen" value={prefs.zenMode} onChange={() => store.togglePref('zen')} />
          </PrefRow>

          <PrefRow icon={<Text style={{ fontSize: 18 }}>🌅</Text>} label="Début de journée" hint={dayStartHint(prefs.dayStartHour)}>
            <View />
          </PrefRow>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: colors.border }}
            accessibilityLabel="Heure de début de journée"
          >
            {HOURS.map((h) => (
              <Chip
                key={h}
                label={dayStartLabel(h)}
                selected={prefs.dayStartHour === h}
                onPress={() => {
                  store.setDayStartHour(h);
                  notify(h === 0 ? 'Les jours changent à minuit' : `Ta journée commence à ${String(h).padStart(2, '0')}:00`, 'moon', 3200);
                }}
              />
            ))}
          </ScrollView>

          <PrefRow icon={<Text style={{ fontSize: 18 }}>📋</Text>} label="Bilan du lundi" hint="Résumé de la semaine écoulée" last>
            <Toggle label="Bilan du lundi" value={prefs.weeklyReview} onChange={() => store.togglePref('review')} />
          </PrefRow>
        </View>
      </View>

      <RemindersSection notifsEnabled={prefs.notifsEnabled} />

      <View style={{ gap: 8, marginTop: 8 }}>
        <AppText variant="label" tone="text3">
          Jours de pause
        </AppText>
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' }}>
          <PrefRow icon={<Text style={{ fontSize: 18 }}>⏸</Text>} label="Quota mensuel" hint="Jours de repos qui gèlent tes séries">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Chip label="−" selected={false} onPress={() => pause.quota > 0 && store.changePauseQuota(-1)} />
              <AppText variant="heading" accessibilityLiveRegion="polite">
                {pause.quota}
              </AppText>
              <Chip label="+" selected={false} onPress={() => pause.quota < 10 && store.changePauseQuota(1)} />
            </View>
          </PrefRow>
          <PrefRow icon={<View />} label={`Ce mois-ci : ${pause.usedThisMonth} / ${pause.quota} utilisé${pause.usedThisMonth > 1 ? 's' : ''}`} last>
            <Link href="/pause" asChild>
              <Button label="Poser une pause" variant="outline" style={{ minHeight: 40, paddingHorizontal: 12 }} />
            </Link>
          </PrefRow>
        </View>
      </View>

      <BackupSection />

      <Card shadow={false} style={{ marginTop: 16, borderColor: colors.danger, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="alert" size={18} color={colors.danger} />
          <AppText variant="bodyStrong" tone="danger">
            Zone de danger
          </AppText>
        </View>
        <AppText variant="caption" tone="text2">
          Efface définitivement toutes les données. Action irréversible.
        </AppText>
        <Button label="Réinitialiser toutes les données" variant="danger" onPress={() => void reset()} />
      </Card>
    </Screen>
  );
}
