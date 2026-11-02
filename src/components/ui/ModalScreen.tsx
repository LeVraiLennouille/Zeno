import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { Icon } from '@/icons/Icon';
import { layout, useTheme } from '@/theme';

import { AppText } from './AppText';

/** Gabarit des écrans présentés en feuille modale : titre, bouton fermer, contenu défilant. */
export function ModalScreen({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  useEscapeToClose(() => router.back());
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.border }]}>
        <AppText variant="title" style={{ flexShrink: 1 }}>
          {title}
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} onPress={() => router.back()}>
          <Icon name="close" size={24} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1.5 },
  body: { padding: 20, gap: 18, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
});
