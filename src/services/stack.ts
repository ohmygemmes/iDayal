import type { Task } from '../types/task';

/**
 * Ordre de la pile de cartes : tâches du jour non complétées,
 * avec la tâche « en cours » (épinglée) remontée en tête.
 */
export function buildStack(todayTasks: Task[]): Task[] {
  const pending = todayTasks.filter((t) => !t.completedDate);
  const idx = pending.findIndex((t) => t.isPinned);
  if (idx <= 0) return pending;
  return [pending[idx], ...pending.slice(0, idx), ...pending.slice(idx + 1)];
}

/**
 * Ordre réel du paquet, en trois couches.
 *
 * `buildStack` remonte l'étoile ; `front` est la tâche que le dernier geste a
 * mise devant — un choix dans le paquet, ou une tâche qu'on vient d'écrire ;
 * `back` regroupe celles déjà arbitrées, qui passent derrière tout le monde.
 *
 * La fonction vit ici parce que deux écrans en dépendent : la vue Cartes pour
 * afficher, et `App` pour savoir quelle tâche est réellement sous les yeux —
 * il recalculait un ordre à lui, qui ne correspondait plus à l'affichage.
 */
export function orderDeck(todayTasks: Task[], front: string | null, back: string[]): Task[] {
  let stack = buildStack(todayTasks);

  if (front) {
    const i = stack.findIndex((t) => t.id === front);
    if (i > 0) stack = [stack[i], ...stack.slice(0, i), ...stack.slice(i + 1)];
  }

  if (back.length === 0) return stack;
  const head = stack.filter((t) => !back.includes(t.id));
  const tail = back
    .map((id) => stack.find((t) => t.id === id))
    .filter((t): t is Task => !!t);
  return [...head, ...tail];
}
