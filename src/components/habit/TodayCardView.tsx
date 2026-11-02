import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { fmtNum, type TodayCard } from '@/domain';
import { flashBus } from '@/services/feedbackPorts';
import { useStore } from '@/state/react';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Chip } from '../ui/Chip';
import { HabitBadge } from '../ui/HabitBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';
import { HabitToggleButton } from './HabitToggleButton';
import { SubLabel } from './SubLabel';

/** Carte d'une habitude du jour : se colore à l'encre de l'habitude une fois terminée. */
export function TodayCardView({ card }: { readonly card: TodayCard }) {
  const store = useStore();
  const { colors } = useTheme();
  const { habit, control, done } = card;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(
    () =>
      flashBus.subscribe((id) => {
        if (id !== habit.id) return;
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.03, duration: 110, useNativeDriver: false }),
          Animated.timing(scale, { toValue: 1, duration: 190, useNativeDriver: false }),
        ]).start();
      }),
    [habit.id, scale],
  );

  if (card.collapsed) return null;

  const fg = done ? colors.inkText : colors.text;
  const muted = done ? colors.inkText : colors.text2;
  const inline = card.placement === 'inline';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Card style={done ? { backgroundColor: habit.color, borderColor: habit.color } : undefined}>
        <View style={styles.top}>
          <View style={styles.left}>
            <HabitBadge habit={habit} />
            <View style={styles.info}>
              <AppText variant="heading" numberOfLines={1} style={{ color: fg }}>
                {habit.name}
              </AppText>
              <SubLabel segments={card.sub} color={muted} />
            </View>
          </View>
          {inline && control.kind === 'toggle' ? (
            <HabitToggleButton
              name={habit.name}
              done={control.done}
              fail={control.fail}
              tint={done ? colors.inkText : undefined}
              onPress={() => store.toggleHabit(habit.id)}
            />
          ) : null}
        </View>

        {control.kind === 'stepper' ? (
          <View style={styles.stepper}>
            <View style={styles.valueRow}>
              <AppText variant="title" style={{ color: fg }}>
                {fmtNum(control.value)}
                <AppText variant="body" style={{ color: muted }}>
                  {' '}
                  / {fmtNum(control.goal)} {control.unit}
                </AppText>
              </AppText>
              <AppText variant="caption" style={{ color: muted }}>
                {control.hint}
              </AppText>
            </View>
            <ProgressBar pct={control.pct} color={done ? colors.inkText : habit.color} label={habit.name} />
            <View style={styles.buttons}>
              <StepButton
                label="−"
                accessibility={`Retirer ${fmtNum(control.step)} ${control.unit}`}
                disabled={!control.canRemove}
                color={fg}
                minus
                onPress={() => (control.drink ? store.removeDrink() : store.removeCounter(habit.id))}
              />
              {control.addAmounts.map((amount) => (
                <StepButton
                  key={amount}
                  label={`+${fmtNum(amount)} ${control.unit}`}
                  accessibility={`Ajouter ${fmtNum(amount)} ${control.unit}`}
                  color={fg}
                  onPress={() => (control.drink ? store.addDrink(amount) : store.addCounter(habit.id))}
                />
              ))}
            </View>
          </View>
        ) : null}

        {control.kind === 'badLevels' ? (
          <View style={styles.chips}>
            {control.options.map((label, i) => (
              <Chip
                key={label}
                label={label}
                tone={i === 0 ? 'neutral' : 'danger'}
                selected={control.selected === i}
                onPress={() => store.setBadLevel(habit.id, i)}
              />
            ))}
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

function StepButton({
  label,
  accessibility,
  onPress,
  disabled = false,
  minus = false,
  color,
}: {
  readonly label: string;
  readonly accessibility: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly minus?: boolean;
  readonly color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibility}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepBtn,
        minus ? styles.minus : styles.plus,
        { borderColor: color, opacity: disabled ? 0.3 : pressed ? 0.7 : 1 },
      ]}
    >
      <AppText variant="subheading" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  info: { flexShrink: 1, gap: 2 },
  stepper: { marginTop: 14, gap: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stepBtn: { height: 46, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  minus: { width: 56 },
  plus: { flex: 1, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
});
