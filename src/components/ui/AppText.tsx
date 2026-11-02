import { Text, type TextProps, type TextStyle } from 'react-native';

import { TEXT_VARIANTS, useTheme, type TextVariant, type ThemeColors } from '@/theme';

export type TextTone = keyof Pick<ThemeColors, 'text' | 'text2' | 'text3' | 'success' | 'danger' | 'accentText' | 'onAccent' | 'inkText'>;

export interface AppTextProps extends TextProps {
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
}

/** Texte themé : police, taille et couleur viennent des tokens, jamais d'une valeur en dur. */
export function AppText({ variant = 'body', tone = 'text', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const v = TEXT_VARIANTS[variant];
  const base: TextStyle = {
    fontFamily: v.fontFamily,
    fontSize: v.fontSize,
    lineHeight: v.lineHeight,
    color: colors[tone],
    ...(v.letterSpacing !== undefined ? { letterSpacing: v.letterSpacing } : {}),
    ...(v.textTransform !== undefined ? { textTransform: v.textTransform } : {}),
  };
  return <Text {...rest} style={[base, style]} />;
}
