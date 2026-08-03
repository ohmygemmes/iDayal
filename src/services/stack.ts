import type { Task } from '../types/task';

/**
 * Ordre de la pile de cartes : tâches du jour non complétées,
 * avec la tâche « en cours » (épinglée) remontée en tête.
 */
export function buildStack(todayTasks: Task[], pinnedTaskId: string | null): Task[] {
  const pending = todayTasks.filter((t) => !t.completedDate);
  if (!pinnedTaskId) return pending;
  const idx = pending.findIndex((t) => t.id === pinnedTaskId);
  if (idx <= 0) return pending;
  return [pending[idx], ...pending.slice(0, idx), ...pending.slice(idx + 1)];
}
