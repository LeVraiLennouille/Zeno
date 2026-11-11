import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isIconName, Icon } from '@/icons/Icon';
import { toastBus } from '@/services/feedbackPorts';
import type { ToastRequest } from '@/state';
import { layout, radius, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';

const NATIVE = Platform.OS !== 'web';

/** Un toast à la fois, au-dessus du dock : un nouveau remplace l'actuel (comme la PWA). */
export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastRequest | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const off = toastBus.subscribe((next) => {
      clearTimeout(hideTimer.current);
      setToast(next);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: NATIVE }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: NATIVE }).start(() => setToast(null));
      }, next.durationMs);
    });
    return () => {
      off();
      clearTimeout(hideTimer.current);
    };
  }, [opacity]);

  if (!toast) return null;
  return (
    <View style={[styles.wrap, { bottom: layout.dockHeight + layout.dockInset + insets.bottom + 16, pointerEvents: 'box-none' }]}>
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: colors.dockBg, opacity }]}
      >
        {isIconName(toast.icon) ? <Icon name={toast.icon} size={18} color={colors.dockFg} /> : null}
        <AppText variant="bodyStrong" style={[styles.text, { color: colors.dockFg }]}>
          {toast.text}
        </AppText>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              toast.action?.run();
              clearTimeout(hideTimer.current);
              setToast(null);
            }}
          >
            <AppText variant="label" style={{ color: colors.dockFg, textDecorationLine: 'underline' }}>
              {toast.action.label}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: layout.contentMaxWidth,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  text: { flexShrink: 1 },
});
