import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { confettiBus } from '@/services/feedbackPorts';
import { INK_COLORS } from '@/theme';

const NATIVE = Platform.OS !== 'web';
const PIECES = 48;

interface Piece {
  readonly id: number;
  readonly x: number;
  readonly size: number;
  readonly color: string;
  readonly drift: number;
  readonly spin: number;
  readonly progress: Animated.Value;
}

/** Pluie de confettis aux couleurs des encres ; désactivée si l'utilisateur réduit les animations. */
export function ConfettiOverlay() {
  const { width, height } = useWindowDimensions();
  const [pieces, setPieces] = useState<readonly Piece[]>([]);
  const burst = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const off = confettiBus.subscribe(() => {
      void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
        if (reduce) return;
        const batch = burst.current++;
        const next = Array.from({ length: PIECES }, (_, i): Piece => ({
          id: batch * PIECES + i,
          x: Math.random() * width,
          size: 6 + Math.random() * 8,
          color: INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)] ?? INK_COLORS[0],
          drift: (Math.random() - 0.5) * 140,
          spin: 360 + Math.random() * 540,
          progress: new Animated.Value(0),
        }));
        setPieces(next);
        Animated.parallel(
          next.map((p) =>
            Animated.timing(p.progress, {
              toValue: 1,
              duration: 1800 + Math.random() * 900,
              delay: Math.random() * 300,
              useNativeDriver: NATIVE,
            }),
          ),
        ).start();
        clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(() => setPieces([]), 3200);
      });
    });
    return () => {
      off();
      clearTimeout(clearTimer.current);
    };
  }, [width]);

  if (pieces.length === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      {pieces.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            opacity: p.progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
              { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
