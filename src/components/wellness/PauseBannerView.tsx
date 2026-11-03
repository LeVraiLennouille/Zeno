import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { pauseBanner } from '@/domain';
import { notify } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

/** « Jour de pause · Reprendre » ou pastille « Pause 2/3 ce mois-ci ». */
export function PauseBannerView() {
  const banner = useModel(pauseBanner);
  const store = useStore();
  const { colors } = useTheme();
  if (banner.kind === 'none') return null;
  if (banner.kind === 'pill') {
    return (
      <Link href="/pause" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Poser une pause, ${banner.left} sur ${banner.quota} restantes ce mois-ci`}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderStrong }}
        >
          <AppText variant="caption">⏸ Pause</AppText>
          <AppText variant="caption" tone="text2">
            {banner.left}/{banner.quota} ce mois-ci
          </AppText>
        </Pressable>
      </Link>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surface }}>
      <AppText variant="title">⏸</AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">Jour de pause</AppText>
        <AppText variant="caption" tone="text2">
          {banner.reason.emoji} {banner.reason.label} · séries gelées
        </AppText>
      </View>
      <Button
        label="Reprendre"
        variant="outline"
        style={{ minHeight: 40, paddingHorizontal: 14 }}
        onPress={() => {
          store.removePause(banner.date);
          notify('Pause annulée', 'moon', 2200);
        }}
      />
    </View>
  );
}
