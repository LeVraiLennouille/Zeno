import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export interface TabDef<T extends string> {
  readonly id: T;
  readonly label: string;
}

/** Onglets textuels soulignés (« Aujourd'hui · Semaine · Global »). */
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
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.id)}
            style={[styles.tab, { borderBottomColor: active ? colors.text : 'transparent' }]}
          >
            <AppText variant="heading" tone={active ? 'text' : 'text2'}>
              {t.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, borderBottomWidth: 1.5 },
  tab: { minHeight: 44, justifyContent: 'center', paddingTop: 8, paddingBottom: 6, borderBottomWidth: 3, marginBottom: -1.5 },
});
