import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from '@/domain';

type Permission = 'granted' | 'denied' | 'unsupported';

const CHANNEL = 'reminders';
let configured = false;
let signature = '';
let webTimers: ReturnType<typeof setTimeout>[] = [];

interface WebNotificationApi {
  permission: string;
  requestPermission(): Promise<string>;
}
const webApi = (): WebNotificationApi | undefined =>
  (globalThis as unknown as { Notification?: WebNotificationApi }).Notification;

async function configureNative(): Promise<void> {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Rappels', importance: Notifications.AndroidImportance.DEFAULT });
  }
}

/** Demande l'autorisation d'afficher des notifications (téléphone ou navigateur). */
export async function ensurePermission(): Promise<Permission> {
  try {
    if (Platform.OS === 'web') {
      const api = webApi();
      if (!api) return 'unsupported';
      const status = api.permission === 'default' ? await api.requestPermission() : api.permission;
      return status === 'granted' ? 'granted' : 'denied';
    }
    await configureNative();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'denied';
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function cancelAllNotifications(): Promise<void> {
  signature = '';
  webTimers.forEach(clearTimeout);
  webTimers = [];
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignoré */
  }
}

/**
 * Remplace les notifications programmées par `plan`. Sur mobile, elles sonnent même app
 * fermée ; sur le web elles ne sonnent que tant que l'onglet reste ouvert.
 */
export async function syncNotifications(plan: readonly PlannedNotification[]): Promise<void> {
  const sig = plan.map((p) => p.key).join('|');
  if (sig === signature) return;
  signature = sig;
  try {
    if (Platform.OS === 'web') {
      webTimers.forEach(clearTimeout);
      webTimers = [];
      const DAY = 24 * 3600 * 1000;
      for (const p of plan) {
        const delay = p.at.getTime() - Date.now();
        if (delay <= 0 || delay > DAY) continue;
        webTimers.push(
          setTimeout(() => {
            const Ctor = (globalThis as unknown as { Notification?: new (title: string, options?: { body?: string }) => unknown }).Notification;
            if (Ctor) new Ctor(p.title, { body: p.body });
          }, delay),
        );
      }
      return;
    }
    await configureNative();
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const p of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: p.title, body: p.body, data: { key: p.key } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: CHANNEL },
      });
    }
  } catch {
    signature = '';
  }
}

/** Notification immédiate pour vérifier que tout fonctionne. */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const title = '🔔 Notification test';
    const body = 'Tout fonctionne : tes rappels te parviendront.';
    if (Platform.OS === 'web') {
      const Ctor = (globalThis as unknown as { Notification?: new (title: string, options?: { body?: string }) => unknown }).Notification;
      if (!Ctor) return false;
      new Ctor(title, { body });
      return true;
    }
    await configureNative();
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
    return true;
  } catch {
    return false;
  }
}
