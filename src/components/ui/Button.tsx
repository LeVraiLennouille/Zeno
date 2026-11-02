import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  readonly label: string;
  readonly variant?: 'primary' | 'outline' | 'danger';
  readonly leading?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', leading, style, disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const palette =
    variant === 'primary'
      ? { bg: colors.accent, fg: colors.onAccent, border: colors.accent }
      : variant === 'danger'
        ? { bg: 'transparent', fg: colors.danger, border: colors.danger }
        : { bg: 'transparent', fg: colors.text, border: colors.text };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {leading}
      <AppText variant="subheading" style={{ color: palette.fg }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
