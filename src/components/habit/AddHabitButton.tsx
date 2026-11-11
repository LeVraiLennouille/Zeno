import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/icons/Icon';
import { hardShadow, INK_COLORS, layout, useTheme } from '@/theme';

/** Bouton « + » flottant : crée une habitude. Calé à droite de la colonne de 430 px comme `.fab`. */
export function AddHabitButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: layout.dockHeight + layout.dockInset + insets.bottom + 14, pointerEvents: 'box-none' }]}>
      <View style={styles.column}>
        <Link href="/habit/new" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouvelle habitude"
            style={({ pressed }) => [styles.fab, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }, hardShadow(INK_COLORS[2])]}
          >
            <Icon name="plus" size={26} color={colors.bg} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' },
  column: { width: '100%', maxWidth: layout.contentMaxWidth, alignItems: 'flex-end', paddingHorizontal: 18, pointerEvents: 'box-none' },
  fab: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
