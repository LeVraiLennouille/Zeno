import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type AnyIconName } from '@/icons/Icon';
import { layout, softShadow, useTheme } from '@/theme';

import { AppText } from './AppText';

export type DockProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Readonly<Record<string, AnyIconName>> = {
  index: 'navHome',
  achievements: 'navAchievements',
  report: 'navReport',
  habits: 'navHabits',
  account: 'navAccount',
};

/**
 * Dock flottant en pilule : l'onglet actif s'élargit (flex 2,4), prend le fond inversé et affiche son libellé ;
 * les autres n'affichent que l'icône à 72 % d'opacité.
 */
export function DockBar({ state, descriptors, navigation }: DockProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + layout.dockInset,
        alignItems: 'center',
        pointerEvents: 'box-none',
      }}
    >
      <View style={{ width: '100%', maxWidth: layout.contentMaxWidth, paddingHorizontal: layout.dockInset }}>
        <View
          accessibilityRole="tablist"
          style={[
            {
              height: layout.dockHeight,
              padding: 6,
              flexDirection: 'row',
              gap: 2,
              backgroundColor: colors.dockBg,
              borderRadius: 32,
            },
            softShadow(scheme),
          ]}
        >
          {state.routes.map((route: DockProps['state']['routes'][number], index: number) => {
            const focused = state.index === index;
            const options = descriptors[route.key]?.options;
            const title = options?.title ?? route.name;
            const fg = focused ? colors.dockBg : `${colors.dockFg}B8`;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? title}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={{
                  flex: focused ? 2.4 : 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 26,
                  backgroundColor: focused ? colors.dockFg : 'transparent',
                }}
              >
                <Icon name={ICONS[route.name] ?? 'navHome'} size={22} color={fg} />
                {focused ? (
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ fontSize: 13, lineHeight: 16, color: fg }}>
                    {title}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
