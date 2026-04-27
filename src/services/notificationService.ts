import type { Task } from '../types/task';

const timers = new Set<number>();

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers.clear();
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function notify(title: string, body: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: './icon-192.svg', badge: './icon-192.svg' });
  } catch {
    // ignore
  }
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

interface ScheduleParams {
  enabled: boolean;
  morningTime: string; // "HH:mm"
  tasks: Task[];
}

/**
 * Programme la notification du résumé matin et les rappels horaires des tâches du jour.
 * Recalculé à chaque appel — on annule les timers en cours.
 */
export function scheduleNotifications({ enabled, morningTime, tasks }: ScheduleParams) {
  clearTimers();
  if (!enabled || !isNotificationSupported() || Notification.permission !== 'granted') return;

  // --- Résumé matin ---
  const [hh, mm] = morningTime.split(':').map((s) => parseInt(s, 10));
  const now = new Date();
  const target = new Date();
  target.setHours(hh || 8, mm || 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  // setTimeout limit ~24.8 jours, on est largement en dessous (max ~24h).
  const morningId = window.setTimeout(() => {
    const today = todayKey();
    const todays = tasks.filter(
      (t) => !t.completedDate && (t.scheduledDate?.slice(0, 10) ?? t.createdDate) <= today
    );
    const carried = todays.filter((t) => t.isCarriedOver).length;
    notify(
      'iDayal — bonjour !',
      `Tu as ${todays.length} tâche${todays.length > 1 ? 's' : ''} aujourd'hui` +
        (carried > 0 ? `, dont ${carried} reportée${carried > 1 ? 's' : ''}` : '') +
        '.'
    );
  }, delay);
  timers.add(morningId);

  // --- Alertes planifiées (tâche avec heure dans le futur) ---
  for (const t of tasks) {
    if (t.completedDate || !t.scheduledDate) continue;
    if (t.scheduledDate.length <= 10) continue; // pas d'heure
    const ts = new Date(t.scheduledDate).getTime();
    const wait = ts - Date.now();
    if (wait <= 0 || wait > 24 * 60 * 60 * 1000) continue; // on planifie sur 24h max
    const id = window.setTimeout(() => {
      notify('🕐 Rappel iDayal', t.title);
    }, wait);
    timers.add(id);
  }
}

export function cancelAllNotifications() {
  clearTimers();
}
