import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfettiOverlay } from '@/components/feedback/ConfettiOverlay';
import { ToastHost } from '@/components/feedback/ToastHost';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { useFeedbackWiring } from '@/hooks/useFeedbackWiring';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { setupWebPwa } from '@/services/webPwa';
import { appStore } from '@/services/appStore';
import { useAppState, StoreProvider } from '@/state/react';
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

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider mode={db.profile.themeMode}>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
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
