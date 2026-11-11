import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { AddHabitButton } from '@/components/habit/AddHabitButton';
import { EmptyNote } from '@/components/habit/EmptyNote';
import { HeroBlock } from '@/components/habit/HeroBlock';
import { OverallRowView } from '@/components/habit/OverallRowView';
import { TodayCardView } from '@/components/habit/TodayCardView';
import { WeekRowView } from '@/components/habit/WeekRowView';
import { DotsIcon, HeaderActionButton } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { BackupNudgeView } from '@/components/wellness/BackupNudgeView';
import { PauseBannerView } from '@/components/wellness/PauseBannerView';
import { WellnessSection } from '@/components/wellness/WellnessSection';
import { TabsRow, type TabDef } from '@/components/ui/TabsRow';
import { drinkCfg, fmtNum, getDrinkMl, lastWeekMonday, overallModel, reviewDue, shouldPromptMood, today, todayModel, weekModel } from '@/domain';
import { notify } from '@/services/toast';
import { useCtx, useModel, useStore } from '@/state/react/StoreProvider';

/** Bilan du lundi et humeur du jour ne sont proposés qu'une fois par session, comme dans la PWA. */
const shown = { review: false, mood: false };

type HomeTab = 'today' | 'weekly' | 'overall';

const TABS: readonly TabDef<HomeTab>[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'weekly', label: 'Semaine' },
  { id: 'overall', label: 'Global' },
];

function TodayList() {
  const { cards, empty } = useModel(todayModel);
  if (empty === 'paused') {
    return <EmptyNote glyph="⏸" title="Jour de pause" text="Tes séries sont gelées. Profite de ta journée." />;
  }
  if (empty === 'empty') {
    return <EmptyNote text="Aucune habitude prévue aujourd'hui. Appuie sur + pour en créer une." />;
  }
  return (
    <View style={{ gap: 10 }}>
      {cards.map((card) => (
        <TodayCardView key={card.habit.id} card={card} />
      ))}
    </View>
  );
}

function WeekList() {
  const rows = useModel(weekModel);
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row) => (
        <WeekRowView key={row.habit.id} row={row} />
      ))}
    </View>
  );
}

function OverallList() {
  const rows = useModel(overallModel);
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row) => (
        <OverallRowView key={row.habit.id} row={row} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [tab, setTab] = useState<HomeTab>('today');
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const pathname = usePathname();
  const { action } = useLocalSearchParams<{ action?: string }>();

  // Raccourcis (`/?action=mood|breathing|meditation|water`) : écran d'accueil de l'app ou lien profond.
  useEffect(() => {
    if (!action) return;
    router.setParams({ action: '' });
    if (action === 'mood') router.push('/mood');
    else if (action === 'breathing') router.push('/breathing');
    else if (action === 'meditation') router.push('/meditation');
    else if (action === 'water') {
      const cfg = drinkCfg(store.ctx.db);
      store.addDrink(cfg.step);
      notify(`+${fmtNum(cfg.step)} ml · ${fmtNum(getDrinkMl(store.ctx.db, today(store.ctx)))} / ${fmtNum(cfg.goal)} ml`, 'drink', 2600);
    }
  }, [action, router, store]);
  const onHome = useRef(true);
  onHome.current = pathname === '/' || pathname === '/index';

  // Chaque invite attend que l'accueil soit à l'écran (aucune feuille par-dessus une autre).
  useEffect(() => {
    const want = (): 'review' | 'mood' | null =>
      !shown.review && reviewDue(ctx) ? 'review' : !shown.mood && shouldPromptMood(ctx) ? 'mood' : null;
    if (!want()) return;
    let tries = 0;
    const id = setInterval(() => {
      const next = want();
      if (!next || ++tries > 40) return clearInterval(id);
      if (!onHome.current) return;
      clearInterval(id);
      shown[next] = true;
      if (next === 'review') {
        const mon = lastWeekMonday(ctx);
        store.markWeekReviewed(mon);
        router.push({ pathname: '/review', params: { mon } });
      } else router.push('/mood');
    }, shown.review ? 2000 : 1200);
    return () => clearInterval(id);
  }, [ctx, router, store]);

  return (
    <>
      <Screen
        headerRight={
          <HeaderActionButton label="Menu" onPress={() => router.push('/profile')}>
            <DotsIcon />
          </HeaderActionButton>
        }
      >
        <HeroBlock />
        <PauseBannerView />
        <BackupNudgeView />
        <TabsRow tabs={TABS} value={tab} onChange={setTab} />
        <View style={{ marginTop: 6 }}>
          {tab === 'today' ? <TodayList /> : tab === 'weekly' ? <WeekList /> : <OverallList />}
        </View>
        <WellnessSection />
      </Screen>
      <AddHabitButton />
    </>
  );
}
