import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { sleepSummary } from '@/domain';
import { Icon, type AnyIconName } from '@/icons/Icon';
import { useModel } from '@/state/react';
import { INK_COLORS, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Tile {
  readonly href: '/mood' | '/breathing' | '/meditation';
  readonly label: string;
  readonly icon: AnyIconName;
  readonly ink: string;
}

const TILES: readonly Tile[] = [
  { href: '/mood', label: 'Humeur du jour', icon: 'mood', ink: INK_COLORS[4] },
  { href: '/breathing', label: 'Respiration', icon: 'breath', ink: INK_COLORS[1] },
  { href: '/meditation', label: 'Méditation', icon: 'meditate', ink: INK_COLORS[3] },
];

/** Section « Bien-être » : trois accès rapides et le résumé de la nuit. */
export function WellnessSection() {
  const { colors } = useTheme();
  const { entry } = useModel(sleepSummary);
  return (
    <View style={{ gap: 12, marginTop: 28 }}>
      <AppText variant="heading" accessibilityRole="header">
        Bien-être
      </AppText>
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.label}
              style={({ pressed }) => [styles.tile, { backgroundColor: t.ink, opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name={t.icon} size={26} color={colors.inkText} />
              <AppText variant="caption" style={{ color: colors.inkText, textAlign: 'center' }}>
                {t.label}
              </AppText>
            </Pressable>
          </Link>
        ))}
      </View>
      <Card shadow={false} style={{ gap: 10 }}>
        <View style={styles.sleepHead}>
          <AppText variant="heading">Sommeil</AppText>
          <Link href="/sleep" asChild>
            <Button label="Saisir" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} />
          </Link>
        </View>
        {entry ? (
          <View style={{ gap: 6 }}>
            <AppText variant="title">
              {entry.hours} h {String(entry.minutes).padStart(2, '0')} min
            </AppText>
            {entry.bedtime || entry.wakeTime ? (
              <View style={{ flexDirection: 'row', gap: 20 }}>
                {entry.bedtime ? <Meta label="Coucher" value={entry.bedtime} /> : null}
                {entry.wakeTime ? <Meta label="Réveil" value={entry.wakeTime} /> : null}
              </View>
            ) : null}
          </View>
        ) : (
          <AppText tone="text2">Pas encore de nuit saisie aujourd'hui.</AppText>
        )}
      </Card>
    </View>
  );
}

function Meta({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View>
      <AppText variant="label" tone="text3">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, minHeight: 92, borderRadius: 20, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sleepHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
