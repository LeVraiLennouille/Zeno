import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfettiOverlay } from '@/components/feedback/ConfettiOverlay';
import { ToastHost } from '@/components/feedback/ToastHost';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { useFeedbackWiring } from '@/hooks/useFeedbackWiring';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { setupWebPwa } from '@/services/webPwa';
import { appStore } from '@/services/appStore';
import { useAppState, StoreProvider } from '@/state/react/StoreProvider';
import { FONT_FILES, ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const { scheme, colors } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="avatar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="mood" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="detail/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sleep" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pause" options={{ presentation: 'modal' }} />
        <Stack.Screen name="challenge/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="breathing" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="meditation" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <ToastHost />
      <ConfettiOverlay />
    </>
  );
}

function Shell({ fontsReady }: { readonly fontsReady: boolean }) {
  const { hydrated, db } = useAppState();
  useAppLifecycle();
  useFeedbackWiring();
  useNotificationSync();
  useEffect(() => setupWebPwa(), []);

  const ready = fontsReady && hydrated;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Le thème enveloppe toujours l'arbre : aucun composant ne peut s'afficher sans lui.
  return (
    <SafeAreaProvider>
      <ThemeProvider mode={hydrated ? db.profile.themeMode : 'system'}>{ready ? <ThemedStack /> : null}</ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Écran d'erreur lisible (au lieu d'une page blanche) : message, détail copiable, bouton « Réessayer ». */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#EDEEF0' }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#12131A' }}>Une erreur est survenue</Text>
      <Text selectable style={{ fontSize: 15, color: '#D63A3A' }}>
        {error.message}
      </Text>
      <Text selectable style={{ fontSize: 12, color: '#565862' }}>
        {String(error.stack ?? '').split('\n').slice(0, 8).join('\n')}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Réessayer" onPress={retry}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: '#12131A', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Réessayer</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);

  useEffect(() => {
    void appStore.hydrate();
  }, []);

  return (
    <StoreProvider store={appStore}>
      <Shell fontsReady={fontsLoaded || fontError !== null} />
    </StoreProvider>
  );
}