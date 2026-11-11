import { Tabs } from 'expo-router';

import { DockBar, type DockProps } from '@/components/ui/DockBar';

interface TabDef {
  readonly name: string;
  readonly title: string;
}

const TABS: readonly TabDef[] = [
  { name: 'index', title: 'Accueil' },
  { name: 'achievements', title: 'Succès' },
  { name: 'report', title: 'Rapport' },
  { name: 'habits', title: 'Habitudes' },
  { name: 'account', title: 'Compte' },
];

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props: DockProps) => <DockBar {...props} />} screenOptions={{ headerShown: false, tabBarStyle: { position: 'absolute' } }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarAccessibilityLabel: t.title }} />
      ))}
    </Tabs>
  );
}
