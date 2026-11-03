import { Tabs } from 'expo-router';

import { Icon, type AnyIconName } from '@/icons/Icon';
import { layout, useTheme } from '@/theme';

interface TabDef {
  readonly name: string;
  readonly title: string;
  readonly icon: AnyIconName;
}

const TABS: readonly TabDef[] = [
  { name: 'index', title: 'Accueil', icon: 'navHome' },
  { name: 'achievements', title: 'Succès', icon: 'navAchievements' },
  { name: 'report', title: 'Rapport', icon: 'navReport' },
  { name: 'habits', title: 'Habitudes', icon: 'navHabits' },
  { name: 'account', title: 'Compte', icon: 'navAccount' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.dockFg,
        tabBarInactiveTintColor: `${colors.dockFg}99`,
        tabBarStyle: { backgroundColor: colors.dockBg, borderTopWidth: 0, height: layout.dockHeight },
        tabBarLabelStyle: { fontFamily: 'Instrument-SemiBold', fontSize: 11 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarAccessibilityLabel: t.title,
            // `color` est typé ColorValue par React Navigation : seule une chaîne est exploitable par le SVG.
            tabBarIcon: ({ color, size }) => <Icon name={t.icon} color={typeof color === 'string' ? color : colors.dockFg} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
