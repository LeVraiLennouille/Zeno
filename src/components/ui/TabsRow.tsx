import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export interface TabDef<T extends string> {
  readonly id: T;
  readonly label: string;
}

/** Onglets textuels soulignés (« Aujourd'hui · Semaine · Global »), trait de 4 px sous l'onglet actif. */
export function TabsRow<T extends string>({
  tabs,
  value,
  onChange,
}: {
  readonly tabs: readonly TabDef<T>[];
  readonly value: T;
  readonly onChange: (id: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.row, { borderBottomColor: colors.border }]}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(t.id)} style={styles.tab}>
            <AppText variant="heading" tone={active ? 'text' : 'text2'} style={styles.label}>
              {t.label}
            </AppText>
            {active ? <View style={[styles.underline, { backgroundColor: colors.text }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pleine largeur dans la colonne de 16 px de marge : bord à bord comme `.tabs-row{padding:0 20px}`.
  row: { flexDirection: 'row', gap: 24, borderBottomWidth: 1.5, marginHorizontal: -16, paddingHorizontal: 20 },
  tab: { minHeight: 44, justifyContent: 'center', paddingTop: 10, paddingBottom: 12 },
  label: { fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  underline: { position: 'absolute', left: 0, right: 0, bottom: -1.5, height: 4, borderRadius: 2 },
});
