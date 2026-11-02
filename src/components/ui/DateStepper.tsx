import { Pressable, View } from 'react-native';

import { addDays, fmtDate, parseDate, type DateKey } from '@/domain';
import { Icon } from '@/icons/Icon';
import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Choix d'une date par flèches (jour précédent / suivant), borné par `min` et `max`. */
export function DateStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  readonly label: string;
  readonly value: DateKey;
  readonly min: DateKey;
  readonly max: DateKey;
  readonly onChange: (next: DateKey) => void;
}) {
  const { colors } = useTheme();
  const shift = (n: number): void => {
    const next = fmtDate(addDays(parseDate(value), n));
    if (next >= min && next <= max) onChange(next);
  };
  const text = parseDate(value).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const btn = (n: -1 | 1, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} : jour ${n < 0 ? 'précédent' : 'suivant'}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => shift(n)}
      style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}
    >
      <Icon name={n < 0 ? 'chevronLeft' : 'chevronRight'} size={20} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={{ gap: 4 }}>
      <AppText variant="caption" tone="text2">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {btn(-1, value <= min)}
        <AppText variant="heading" accessibilityLiveRegion="polite">
          {text}
        </AppText>
        {btn(1, value >= max)}
      </View>
    </View>
  );
}
