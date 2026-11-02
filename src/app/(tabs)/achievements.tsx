import { useState } from 'react';

import { AchievementsTab } from '@/components/challenge/AchievementsTab';
import { ChallengesTab } from '@/components/challenge/ChallengesTab';
import { Screen } from '@/components/ui/Screen';
import { TabsRow, type TabDef } from '@/components/ui/TabsRow';

type AchTab = 'challenges' | 'achievements';

const TABS: readonly TabDef<AchTab>[] = [
  { id: 'challenges', label: 'Défis' },
  { id: 'achievements', label: 'Succès' },
];

export default function AchievementsScreen() {
  const [tab, setTab] = useState<AchTab>('challenges');
  return (
    <Screen>
      <TabsRow tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'challenges' ? <ChallengesTab /> : <AchievementsTab />}
    </Screen>
  );
}
