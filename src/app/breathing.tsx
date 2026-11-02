import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreathOrb } from '@/components/wellness/BreathOrb';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import {
  BREATH_PATTERN_OPTIONS,
  BREATH_SHORT,
  BREATHING_PATTERNS,
  breathMotion,
  breathPhaseLabel,
  breathRoundsLabel,
  idleBreath,
  selectBreathPattern,
  startBreath,
  stopBreath,
  tickBreath,
  type BreathPatternId,
  type BreathState,
} from '@/domain';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { Icon } from '@/icons/Icon';
import { haptic } from '@/services/haptics';
import { layout, useTheme } from '@/theme';

const NATIVE = Platform.OS !== 'web';
const SMALL = 0.62;
const LARGE = 1;
const REST = 0.8;

export default function BreathingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [breath, setBreath] = useState<BreathState>(() => idleBreath('box'));
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useRef(new Animated.Value(REST)).current;
  useEscapeToClose(() => router.back());
  const pattern = BREATHING_PATTERNS[breath.pattern];
  const running = breath.status === 'running';

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Une seconde à la fois, tant que la séance tourne.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setBreath((s) => tickBreath(s)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Le cercle suit la phase : il grandit en inspirant, se resserre en expirant.
  const { phaseIdx, pattern: patternId, status, secondsLeft } = breath;
  useEffect(() => {
    const motion = breathMotion({ status, pattern: patternId, phaseIdx, secondsLeft, rounds: 0 });
    if (motion === 'hold') return;
    if (status === 'running') haptic('light');
    const target = motion === 'inhale' ? LARGE : motion === 'exhale' ? SMALL : REST;
    const seconds = BREATHING_PATTERNS[patternId].durations[phaseIdx] ?? 4;
    Animated.timing(scale, {
      toValue: target,
      duration: reduceMotion || motion === 'rest' ? 200 : seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: NATIVE,
    }).start();
    // `secondsLeft` volontairement absent : seul le changement de phase relance l'animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, patternId, status, reduceMotion, scale]);

  const choose = (id: BreathPatternId): void => setBreath(selectBreathPattern(id));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.top}>
          <AppText variant="title">Respiration</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} onPress={() => router.back()}>
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.row} accessibilityRole="radiogroup">
          {BREATH_PATTERN_OPTIONS.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: breath.pattern === o.id }}
              onPress={() => choose(o.id)}
              style={[styles.pattern, { borderColor: breath.pattern === o.id ? colors.text : colors.border, backgroundColor: breath.pattern === o.id ? colors.accentBg : 'transparent' }]}
            >
              <AppText variant="bodyStrong">{o.title}</AppText>
              <AppText variant="caption" tone="text2">
                {o.sub}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
          <BreathOrb scale={scale} progress={null}>
            <AppText variant="hero" style={{ fontSize: 72, lineHeight: 76 }} accessibilityElementsHidden>
              {breath.secondsLeft}
            </AppText>
          </BreathOrb>
          <AppText variant="title" accessibilityRole="header" accessibilityLiveRegion="polite">
            {breathPhaseLabel(breath)}
          </AppText>
          <AppText tone="text2" style={{ textAlign: 'center', maxWidth: 320 }}>
            {pattern.desc}
          </AppText>
        </View>

        <View style={styles.steps}>
          {pattern.phases.map((p, i) => (
            <View
              key={`${p}-${i}`}
              style={[styles.step, { borderColor: running && breath.phaseIdx === i ? colors.text : colors.border, backgroundColor: running && breath.phaseIdx === i ? colors.accentBg : 'transparent' }]}
            >
              <AppText variant="caption" tone="text2">
                {BREATH_SHORT[p]}
              </AppText>
              <AppText variant="bodyStrong">{pattern.durations[i]} s</AppText>
            </View>
          ))}
        </View>

        <AppText style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          <AppText variant="title">{breath.rounds}</AppText>
          <AppText tone="text2"> {breathRoundsLabel(breath.rounds)}</AppText>
        </AppText>

        <Button
          label={running ? 'Arrêter' : 'Commencer'}
          leading={<Icon name={running ? 'stop' : 'play'} size={18} color={colors.onAccent} />}
          onPress={() => setBreath((s) => (s.status === 'running' ? stopBreath(s) : startBreath(s.pattern)))}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 18, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 8 },
  pattern: { flex: 1, borderWidth: 2, borderRadius: 16, paddingVertical: 10, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  step: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
});
