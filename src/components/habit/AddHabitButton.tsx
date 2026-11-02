import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/icons/Icon';
import { hardShadow, INK_COLORS, layout, useTheme } from '@/theme';

/** Bouton « + » flottant : crée une habitude. */
export function AddHabitButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: layout.dockHeight + insets.bottom + 28 }]}>
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
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'flex-end', paddingHorizontal: 18 },
  fab: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
