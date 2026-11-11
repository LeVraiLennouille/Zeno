import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { sleepSummary } from '@/domain';
import { Icon, type AnyIconName } from '@/icons/Icon';
import { useModel } from '@/state/react/StoreProvider';
import { INK_COLORS, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
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

/** Section « Bien-être » : trois tuiles colorées (`.mind-tile`) et le résumé de la nuit (`.sleep-summary-card`). */
export function WellnessSection() {
  const { colors } = useTheme();
  const { entry } = useModel(sleepSummary);
  return (
    <View style={{ gap: 12, marginTop: 20 }}>
      <AppText variant="heading" accessibilityRole="header" style={{ paddingHorizontal: 4 }}>
        Bien-être
      </AppText>
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.label}
              style={({ pressed }) => [styles.tile, { backgroundColor: t.ink, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Icon name={t.icon} size={28} color={colors.inkText} />
              <AppText variant="heading" style={{ color: colors.inkText, fontSize: 16, lineHeight: 18 }}>
                {t.label}
              </AppText>
            </Pressable>
          </Link>
        ))}
      </View>
      <Card shadow={false}>
        <View style={styles.sleepHead}>
          <AppText variant="heading" style={{ fontSize: 19 }}>
            Sommeil
          </AppText>
          <Link href="/sleep" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Saisir" style={{ ...styles.enter, borderColor: colors.text }}>
              <AppText variant="bodyStrong" style={{ fontSize: 14 }}>
                Saisir
              </AppText>
            </Pressable>
          </Link>
        </View>
        {entry ? (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <AppText variant="hero" style={styles.big}>
                {entry.hours}
              </AppText>
              <AppText variant="bodyStrong" tone="text2" style={styles.unit}>
                h
              </AppText>
              <AppText variant="hero" style={styles.big}>
                {String(entry.minutes).padStart(2, '0')}
              </AppText>
              <AppText variant="bodyStrong" tone="text2" style={styles.unit}>
                min
              </AppText>
            </View>
            {entry.bedtime || entry.wakeTime ? (
              <View style={{ flexDirection: 'row', gap: 24, marginTop: 10 }}>
                {entry.bedtime ? <Meta label="Coucher" value={entry.bedtime} /> : null}
                {entry.wakeTime ? <Meta label="Réveil" value={entry.wakeTime} /> : null}
              </View>
            ) : null}
          </View>
        ) : (
          <AppText tone="text2" style={{ marginTop: 8, fontSize: 14 }}>
            Pas encore de nuit saisie aujourd'hui.
          </AppText>
        )}
      </Card>
    </View>
  );
}

function Meta({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="caption" tone="text2">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, minHeight: 112, borderRadius: 22, padding: 14, alignItems: 'flex-start', justifyContent: 'space-between' },
  sleepHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enter: { minHeight: 40, paddingHorizontal: 18, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 51, lineHeight: 52, letterSpacing: -1.5 },
  unit: { marginLeft: 2, marginRight: 6 },
});
