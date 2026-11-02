import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

/** Ligne de préférence : pictogramme, intitulé, aide et contrôle à droite. */
export function PrefRow({
  icon,
  label,
  hint,
  children,
  last = false,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
  readonly last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1.5,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="bodyStrong">{label}</AppText>
          {hint ? (
            <AppText variant="caption" tone="text2">
              {hint}
            </AppText>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}
