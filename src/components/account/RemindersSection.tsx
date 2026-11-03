import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { remindersModel } from '@/domain';
import { Icon } from '@/icons/Icon';
import { ensurePermission, sendTestNotification } from '@/services/notifications';
import { notify } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { radius, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { PrefRow } from '../ui/PrefRow';
import { Toggle } from '../ui/Toggle';

/** Interrupteur général des notifications, liste des rappels et notification test. */
export function RemindersSection({ notifsEnabled }: { readonly notifsEnabled: boolean }) {
  const store = useStore();
  const { colors } = useTheme();
  const rows = useModel(remindersModel);

  const toggleNotifications = async (next: boolean): Promise<void> => {
    if (!next) {
      store.togglePref('notifications');
      notify('Notifications désactivées', 'bellOff', 2400);
      return;
    }
    const permission = await ensurePermission();
    if (permission === 'granted') {
      store.togglePref('notifications');
      const n = rows.filter((r) => r.enabled).length;
      notify(`${n} rappel${n > 1 ? 's' : ''} programmé${n > 1 ? 's' : ''}`, 'bell', 2600);
    } else {
      notify(
        permission === 'denied' ? 'Notifications bloquées : autorise-les dans les réglages de l’appareil' : 'Notifications indisponibles ici',
        'alert',
        4200,
      );
    }
  };

  const test = async (): Promise<void> => {
    notify((await sendTestNotification()) ? 'Notification envoyée' : 'Impossible d’envoyer la notification', 'bell', 2400);
  };

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <AppText variant="label" tone="text3">
        Rappels
      </AppText>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' }}>
        <PrefRow icon={<Icon name="bell" size={20} color={colors.text2} />} label="Notifications" hint="Les rappels sonnent même quand l’app est fermée">
          <Toggle label="Notifications" value={notifsEnabled} onChange={(v) => void toggleNotifications(v)} />
        </PrefRow>
        {rows.map((r) => (
          <PrefRow key={r.id} icon={<AppText variant="caption">{r.time}</AppText>} label={r.title} hint={r.hint}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Link href={{ pathname: '/reminder/[id]', params: { id: r.id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={`Modifier le rappel ${r.title}`} hitSlop={8}>
                  <Icon name="edit" size={20} color={colors.text2} />
                </Pressable>
              </Link>
              <Toggle label={`Rappel ${r.title}`} value={r.enabled} onChange={() => store.toggleReminder(r.id)} />
            </View>
          </PrefRow>
        ))}
        <View style={{ flexDirection: 'row', gap: 10, padding: 14, flexWrap: 'wrap' }}>
          <Link href={{ pathname: '/reminder/[id]', params: { id: 'new' } }} asChild>
            <Button label="+ Ajouter un rappel" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} />
          </Link>
          {notifsEnabled ? <Button label="Tester" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => void test()} /> : null}
        </View>
      </View>
    </View>
  );
}
