import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, useTheme } from '@/theme';

import { PageHeader } from './PageHeader';

/** Conteneur d'écran : fond du thème, en-tête logo, dock flottant réservé, largeur bornée à 430 px (`.app`). */
export function Screen({ children, headerRight }: { readonly children: ReactNode; readonly headerRight?: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <PageHeader right={headerRight} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: layout.dockHeight + layout.dockInset + insets.bottom + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
});
