import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { CheckMark } from '../ui/CheckMark';

/** Pastille ronde de 52 px : vide, cochée (✓) ou « craqué » (✕, rouge). */
export function HabitToggleButton({
  name,
  done,
  fail = false,
  onPress,
  interactive = true,
  size = 52,
  tint,
}: {
  readonly name: string;
  readonly done: boolean;
  readonly fail?: boolean;
  readonly onPress?: () => void;
  readonly interactive?: boolean;
  readonly size?: number;
  /** Couleur de trait quand la carte est colorée (habitude terminée). */
  readonly tint?: string;
}) {
  const { colors } = useTheme();
  const stroke = tint ?? colors.text;
  const background = done ? (fail ? colors.danger : stroke) : 'transparent';
  const border = done && fail ? colors.danger : stroke;
  const glyph = done ? (fail ? '#FFFFFF' : tint ? colors.surface : colors.bg) : 'transparent';
  return (
    <Pressable
      accessibilityRole={interactive ? 'checkbox' : 'image'}
      accessibilityLabel={name}
      accessibilityState={{ checked: done }}
      disabled={!interactive}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: border,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <CheckMark color={glyph} cross={fail && done} />
    </Pressable>
  );
}
