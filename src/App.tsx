import { useEffect, useState } from 'react';
import { BrandHeader } from './components/BrandHeader';
import { CardsView } from './components/CardsView';
import { LaterView } from './components/LaterView';
import { QuickAddBar } from './components/QuickAddBar';
import { SettingsModal } from './components/SettingsModal';
import { TabBar } from './components/TabBar';
import { TodayView } from './components/TodayView';
import { scheduleNotifications } from './services/notificationService';
import { useTaskStore } from './stores/useTaskStore';
import type { TabKey } from './types/task';

const APP_VERSION = '1.0.0';

function applyTheme(mode: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
}

export default function App() {
  const store = useTaskStore();
  const [tab, setTab] = useState<TabKey>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Application du thème + écoute des changements système.
  useEffect(() => {
    applyTheme(store.settings.themeMode);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (store.settings.themeMode === 'system') applyTheme('system');
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [store.settings.themeMode]);

  // Programme les notifications quand les tâches ou les réglages changent.
  useEffect(() => {
    scheduleNotifications({
      enabled: store.settings.notificationsEnabled,
      morningTime: store.settings.morningSummaryTime,
      tasks: store.tasks,
    });
  }, [store.tasks, store.settings.notificationsEnabled, store.settings.morningSummaryTime]);

  // Transition fade entre onglets.
  const handleTab = (next: TabKey) => {
    if (next === tab) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setTab(next);
      setTransitioning(false);
    }, 120);
  };

  const handleAdd = (title: string, scheduledDate: string | null) => {
    store.addTask(title, scheduledDate);
  };

  /** Depuis le paquet, ramène la tâche à aujourd'hui si besoin et l'épingle en top. */
  const handlePromoteToTop = (id: string) => {
    const task = store.tasks.find((t) => t.id === id);
    if (!task) return;
    const isLater =
      !!task.scheduledDate && task.scheduledDate.slice(0, 10) > new Date().toISOString().slice(0, 10);
    if (isLater) store.bringToToday(id);
    // Épingle direct (pinTask toggle si même id, donc on force en updateSettings ici)
    store.updateSettings({ pinnedTaskId: id });
    setTab('cards');
  };

  return (
    <div className="app-shell flex flex-col">
      <BrandHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main
        className={`flex-1 min-h-0 transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {tab === 'today' && (
          <TodayView
            tasks={store.todayTasks}
            onToggle={store.toggleComplete}
            onDelete={store.deleteTask}
            onPin={store.pinTask}
            pinnedTaskId={store.settings.pinnedTaskId}
          />
        )}
        {tab === 'later' && (
          <LaterView
            tasks={store.laterTasks}
            onToggle={store.toggleComplete}
            onDelete={store.deleteTask}
            onBringToToday={store.bringToToday}
          />
        )}
        {tab === 'cards' && (
          <CardsView
            todayTasks={store.todayTasks}
            laterTasks={store.laterTasks}
            pinnedTaskId={store.settings.pinnedTaskId}
            onComplete={store.toggleComplete}
            onPostpone={store.postponeToTomorrow}
            onPromoteToTop={handlePromoteToTop}
          />
        )}
      </main>

      {tab === 'today' && <QuickAddBar onAdd={handleAdd} />}

      <TabBar active={tab} onChange={handleTab} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={store.settings}
        onUpdateSettings={store.updateSettings}
        onCleanCompleted={() => store.cleanOldCompleted(30)}
        onExport={store.exportJSON}
        onImport={store.importJSON}
        appVersion={APP_VERSION}
      />
    </div>
  );
}
