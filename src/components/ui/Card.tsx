import { View, type ViewProps } from 'react-native';

import { hardShadow, INK_COLORS, radius, useTheme } from '@/theme';

export interface CardProps extends ViewProps {
  /** Ombre dure décalée (signature visuelle) ; désactivable pour les cartes imbriquées. */
  readonly shadow?: boolean;
  readonly padded?: boolean;
}

export function Card({ shadow = true, padded = true, style, ...rest }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1.5,
          borderRadius: radius.lg,
          ...(padded ? { padding: 16 } : {}),
        },
        shadow ? hardShadow(INK_COLORS[2]) : null,
        style,
      ]}
    />
  );
}
