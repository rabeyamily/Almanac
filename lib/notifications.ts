import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { ReminderSettings } from '@/lib/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseTime(time: string | null): { hour: number; minute: number } | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour: h, minute: m };
}

export async function cancelReminderNotifications(ids?: string[] | null): Promise<void> {
  if (!ids?.length || Platform.OS === 'web') return;
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

export async function scheduleReminderNotifications(
  title: string,
  fallbackBody: string,
  reminder: ReminderSettings | null | undefined
): Promise<string[]> {
  if (Platform.OS === 'web' || !reminder?.enabled) return [];
  const time = parseTime(reminder.time);
  if (!time) return [];

  const body = reminder.message?.trim() || fallbackBody;
  const ids: string[] = [];

  if (reminder.frequency === 'once') {
    if (!reminder.date) return [];
    const scheduledDate = new Date(`${reminder.date}T${reminder.time}:00`);
    if (Number.isNaN(scheduledDate.getTime())) return [];
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: scheduledDate },
    });
    ids.push(id);
    return ids;
  }

  if (reminder.frequency === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
    ids.push(id);
    return ids;
  }

  const days = reminder.frequency === 'weekdays'
    ? [1, 2, 3, 4, 5]
    : reminder.custom_days ?? [];

  for (const day of days) {
    const weekday = day === 0 ? 1 : day + 1; // Expo weekday: 1=Sunday ... 7=Saturday
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: time.hour,
        minute: time.minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function resyncAllReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  const [catRes, subRes, taskRes] = await Promise.all([
    supabase.from('categories').select('id,name,reminder_settings'),
    supabase.from('subcategories').select('id,name,reminder_settings'),
    supabase.from('tasks').select('id,name,category_id,subcategory_id,reminder_settings'),
  ]);

  const catReminderById = new Map<string, ReminderSettings | null>();
  for (const cat of catRes.data ?? []) catReminderById.set(cat.id, cat.reminder_settings as ReminderSettings | null);
  const subReminderById = new Map<string, ReminderSettings | null>();
  for (const sub of subRes.data ?? []) subReminderById.set(sub.id, sub.reminder_settings as ReminderSettings | null);

  for (const task of taskRes.data ?? []) {
    const own = task.reminder_settings as ReminderSettings | null;
    const inheritedSub = task.subcategory_id ? subReminderById.get(task.subcategory_id) ?? null : null;
    const inheritedCat = task.category_id ? catReminderById.get(task.category_id) ?? null : null;
    const resolved = own?.enabled ? own : inheritedSub?.enabled ? inheritedSub : inheritedCat?.enabled ? inheritedCat : null;
    await scheduleReminderNotifications(`Task Reminder`, task.name, resolved);
  }
}
