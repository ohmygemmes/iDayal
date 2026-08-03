import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Settings, Task } from '../types/task';

const TASKS_KEY = 'idayal:tasks:v1';
const SETTINGS_KEY = 'idayal:settings:v1';

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  morningSummaryTime: '08:00',
  themeMode: 'system',
  pinnedTaskId: null,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD en heure LOCALE (pas UTC). Indispensable pour ne pas se prendre +/- 1 jour à cause du fuseau. */
export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** YYYY-MM-DDTHH:mm en heure LOCALE. */
export function toLocalISODateTime(d: Date): string {
  return `${toLocalISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayISO(): string {
  return toLocalISODate(new Date());
}

function isPastDate(iso: string): boolean {
  const date = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return date.getTime() < start.getTime();
}

function isTodayOrPast(iso: string): boolean {
  const date = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date.getTime() <= end.getTime();
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Task[];
  } catch {
    return [];
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Reporte les tâches non complétées des jours passés vers aujourd'hui. */
function carryOverPastTasks(tasks: Task[]): { tasks: Task[]; changed: boolean } {
  const today = todayISO();
  let changed = false;
  const next = tasks.map((t) => {
    if (t.completedDate) return t;
    const ref = t.scheduledDate ?? t.createdDate;
    if (isPastDate(ref)) {
      changed = true;
      return {
        ...t,
        isCarriedOver: true,
        originalDate: t.originalDate || (t.scheduledDate ? t.scheduledDate.slice(0, 10) : t.createdDate),
        scheduledDate: today,
      };
    }
    return t;
  });
  return { tasks: next, changed };
}

export interface TaskStore {
  tasks: Task[];
  settings: Settings;
  todayTasks: Task[];
  laterTasks: Task[];
  addTask: (title: string, scheduledDate?: string | null) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  postponeToTomorrow: (id: string) => void;
  bringToToday: (id: string) => void;
  pinTask: (id: string | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  cleanOldCompleted: (days?: number) => number;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

export function useTaskStore(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Carry over au montage et à chaque retour de focus.
  useEffect(() => {
    const run = () => {
      setTasks((prev) => {
        const { tasks: next, changed } = carryOverPastTasks(prev);
        return changed ? next : prev;
      });
    };
    run();
    const onVis = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', run);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', run);
    };
  }, []);

  // Persistence à chaque modif.
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const addTask = useCallback((title: string, scheduledDate: string | null = null) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const today = todayISO();
    const task: Task = {
      id: newId(),
      title: trimmed,
      createdDate: today,
      scheduledDate,
      completedDate: null,
      isCarriedOver: false,
      originalDate: today,
    };
    setTasks((prev) => [task, ...prev]);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completedDate: t.completedDate ? null : new Date().toISOString() }
          : t
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const postponeToTomorrow = useCallback((id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const iso = toLocalISODate(tomorrow);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, scheduledDate: iso, isCarriedOver: false } : t))
    );
  }, []);

  const bringToToday = useCallback((id: string) => {
    const today = todayISO();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, scheduledDate: today, isCarriedOver: false } : t))
    );
  }, []);

  const pinTask = useCallback((id: string | null) => {
    setSettings((prev) => ({ ...prev, pinnedTaskId: prev.pinnedTaskId === id ? null : id }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const cleanOldCompleted = useCallback((days = 30) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let removed = 0;
    setTasks((prev) =>
      prev.filter((t) => {
        if (!t.completedDate) return true;
        const ok = new Date(t.completedDate).getTime() >= cutoff;
        if (!ok) removed += 1;
        return ok;
      })
    );
    return removed;
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify({ tasks, settings, exportedAt: new Date().toISOString() }, null, 2);
  }, [tasks, settings]);

  const importJSON = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed?.tasks)) {
        setTasks(parsed.tasks as Task[]);
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        return true;
      }
      if (Array.isArray(parsed)) {
        setTasks(parsed as Task[]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completedDate) {
        const cd = t.completedDate.slice(0, 10);
        return cd === todayISO();
      }
      const ref = t.scheduledDate ?? t.createdDate;
      return isTodayOrPast(ref);
    });
  }, [tasks]);

  const laterTasks = useMemo(() => {
    const today = todayISO();
    return tasks.filter((t) => {
      if (t.completedDate) return false;
      if (!t.scheduledDate) return false;
      return t.scheduledDate.slice(0, 10) > today;
    });
  }, [tasks]);

  return {
    tasks,
    settings,
    todayTasks,
    laterTasks,
    addTask,
    toggleComplete,
    deleteTask,
    postponeToTomorrow,
    bringToToday,
    pinTask,
    updateSettings,
    cleanOldCompleted,
    exportJSON,
    importJSON,
  };
}
