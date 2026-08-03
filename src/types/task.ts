export interface Task {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD) à laquelle la tâche a été créée. */
  createdDate: string;
  /** ISO datetime ou date YYYY-MM-DD si planifiée. null = pour aujourd'hui. */
  scheduledDate: string | null;
  /** ISO datetime de complétion. null = pas encore faite. */
  completedDate: string | null;
  /** True si la tâche a été reportée automatiquement d'un jour précédent. */
  isCarriedOver: boolean;
  /** ISO date YYYY-MM-DD originale (avant report). */
  originalDate: string;
}

export type TabKey = 'today' | 'later' | 'cards';

export interface Settings {
  notificationsEnabled: boolean;
  morningSummaryTime: string; // "HH:mm"
  themeMode: 'system' | 'light' | 'dark';
  /** Tâche à afficher en premier dans l'onglet Cartes. */
  pinnedTaskId: string | null;
}
