import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, useTheme } from '@/theme';

import { Logo } from './Logo';

/** Bouton rond 44 px de l'en-tête (fond surface, bord 1,5 px). */
export function HeaderActionButton({
  label,
  onPress,
  children,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surface2 : colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
      })}
    >
      {children}
    </Pressable>
  );
}

/** Trois points verticaux du menu (SVG 20 × 20 de la PWA). */
export function DotsIcon() {
  const { colors } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 20, height: 20 }}>
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx={10} cy={4} r={1.5} fill={colors.text} />
        <Circle cx={10} cy={10} r={1.5} fill={colors.text} />
        <Circle cx={10} cy={16} r={1.5} fill={colors.text} />
      </Svg>
    </View>
  );
}

/** En-tête de page : logo à gauche, action facultative à droite (`.page-header`). */
export function PageHeader({ right }: { readonly right?: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          height: layout.logoHeight + 2 * layout.logoMargin,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Logo color={colors.text} height={layout.logoHeight} />
        {right ?? <View style={{ width: 36 }} />}
      </View>
    </View>
  );
}
