import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BreathOrb } from '@/components/wellness/BreathOrb';
import {
  initialMed,
  MED_AMBIENCES,
  MED_DURATIONS,
  meditationToday,
  medClock,
  medDescription,
  medElapsed,
  medIsActive,
  medPause,
  medProgress,
  medRun,
  medSelectAmbience,
  medSelectDuration,
  medStartLabel,
  medStatusLabel,
  medStop,
  medTick,
  type Ambience,
  type MedState,
} from '@/domain';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { Icon } from '@/icons/Icon';
import { confirmAsync } from '@/services/confirm';
import { keepScreenOn, releaseScreen } from '@/services/keepAwake';
import { soundPlayer } from '@/services/sound';
import { useCtx, useStore } from '@/state/react/StoreProvider';
import { layout, useTheme } from '@/theme';

const NATIVE = Platform.OS !== 'web';

export default function MeditationScreen() {
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [med, setMed] = useState<MedState>(initialMed);
  const [now, setNow] = useState(() => Date.now());
  const medRef = useRef(med);
  medRef.current = med;
  const soundOn = ctx.db.profile.soundEnabled;
  const scale = useRef(new Animated.Value(0.8)).current;
  const running = med.state === 'running';
  const active = medIsActive(med);

  const apply = useCallback((next: MedState): void => {
    medRef.current = next;
    setMed(next);
  }, []);

  // Respiration lente de l'orbe pendant la séance.
  useEffect(() => {
    if (!running) {
      scale.setValue(0.8);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
        Animated.timing(scale, { toValue: 0.7, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [running, scale]);

  // Horloge : quatre fois par seconde, calculée sur l'heure réelle (la séance survit à la mise en veille).
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const { state, completed } = medTick(medRef.current, t);
      if (state !== medRef.current) apply(state);
      if (completed) {
        soundPlayer.stopAmbience(false);
        releaseScreen();
        store.completeMeditation(medRef.current.dur / 60);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, apply, store]);

  // Quitter l'écran (retour matériel compris) enregistre les minutes entières déjà faites.
  useEffect(
    () => () => {
      const s = medRef.current;
      soundPlayer.stopAmbience(true);
      releaseScreen();
      if (medIsActive(s)) store.stopMeditation(medElapsed(s, Date.now()));
    },
    [store],
  );

  const toggle = (): void => {
    const t = Date.now();
    if (med.state === 'idle' || med.state === 'done') {
      if (soundOn) soundPlayer.play('bell');
      if (soundOn) soundPlayer.startAmbience(med.amb);
      void keepScreenOn();
      apply(medRun(med, t, true));
    } else if (med.state === 'running') {
      soundPlayer.stopAmbience(false);
      releaseScreen();
      apply(medPause(med, t));
    } else {
      if (soundOn) soundPlayer.startAmbience(med.amb);
      void keepScreenOn();
      apply(medRun(med, t, false));
    }
    setNow(t);
  };

  const stop = (): void => {
    store.stopMeditation(medElapsed(med, Date.now()));
    soundPlayer.stopAmbience(false);
    releaseScreen();
    apply(medStop(med));
  };

  const close = async (): Promise<void> => {
    if (active && medElapsed(med, Date.now()) >= 30 && !(await confirmAsync('Arrêter la session en cours ?', 'Les minutes déjà faites seront comptées.', 'Arrêter'))) return;
    router.back();
  };

  useEscapeToClose(() => void close());

  const chooseAmbience = (amb: Ambience): void => {
    apply(medSelectAmbience(med, amb));
    if (running && soundOn) soundPlayer.startAmbience(amb);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.top}>
          <AppText variant="title">Méditation</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} onPress={() => void close()}>
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Durée">
          {MED_DURATIONS.map((d) => {
            const selected = med.dur === d.minutes * 60;
            return (
              <Pressable
                key={d.minutes}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: active }}
                disabled={active}
                onPress={() => apply(medSelectDuration(med, d.minutes))}
                style={[styles.choice, { borderColor: selected ? colors.text : colors.border, backgroundColor: selected ? colors.accentBg : 'transparent', opacity: active && !selected ? 0.4 : 1 }]}
              >
                <AppText variant="bodyStrong">{d.title}</AppText>
                <AppText variant="caption" tone="text2">
                  {d.sub}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Ambiance sonore">
          {MED_AMBIENCES.map((a) => {
            const selected = med.amb === a.id;
            return (
              <Pressable
                key={a.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => chooseAmbience(a.id)}
                style={[styles.amb, { borderColor: selected ? colors.text : colors.border, backgroundColor: selected ? colors.accentBg : 'transparent' }]}
              >
                <AppText variant="caption" style={{ color: colors.text }}>
                  {a.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
          <BreathOrb scale={scale} progress={medProgress(med, now)}>
            <AppText variant="hero" style={{ fontSize: 60, lineHeight: 64 }} accessibilityLabel={`Temps restant ${medClock(med.remaining)}`}>
              {medClock(med.remaining)}
            </AppText>
          </BreathOrb>
          <AppText variant="title" accessibilityRole="header" accessibilityLiveRegion="polite">
            {medStatusLabel(med)}
          </AppText>
          <AppText tone="text2" style={{ textAlign: 'center', maxWidth: 320 }}>
            {medDescription(med.amb, soundOn)}
          </AppText>
        </View>

        <AppText style={{ textAlign: 'center' }}>
          <AppText variant="title">{meditationToday(ctx)}</AppText>
          <AppText tone="text2"> min aujourd'hui</AppText>
        </AppText>

        <View style={{ gap: 10 }}>
          <Button
            label={medStartLabel(med)}
            leading={med.state === 'running' ? undefined : <Icon name="play" size={18} color={colors.onAccent} />}
            onPress={toggle}
          />
          {active ? <Button label="Arrêter" variant="outline" leading={<Icon name="stop" size={18} color={colors.text} />} onPress={stop} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 18, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, borderWidth: 2, borderRadius: 16, paddingVertical: 10, alignItems: 'center' },
  amb: { flex: 1, borderWidth: 2, borderRadius: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
