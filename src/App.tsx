import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandHeader } from './components/BrandHeader';
import { CardsView } from './components/CardsView';
import { CompleteTaskDialog, type CompleteStep } from './components/CompleteTaskDialog';
import { DueTaskBanner } from './components/DueTaskBanner';
import { LaterView } from './components/LaterView';
import { NotesView } from './components/NotesView';
import { QuickAddBar } from './components/QuickAddBar';
import { SettingsModal } from './components/SettingsModal';
import { TabBar } from './components/TabBar';
import { TodayView } from './components/TodayView';
import { parseFrenchDate } from './services/frenchDateParser';
import { scheduleNotifications } from './services/notificationService';
import { buildStack } from './services/stack';
import { useCloudSync } from './hooks/useCloudSync';
import { useTaskStore } from './stores/useTaskStore';
import { toLocalISODate, toLocalISODateTime } from './services/localDate';
import type { TabKey } from './types/task';

const APP_VERSION = '1.2.0';
const SNOOZE_MS = 10 * 60 * 1000;
const FOREVER = Number.MAX_SAFE_INTEGER;

function applyTheme(mode: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
}

/**
 * Convertit une date détectée en chaîne stockable.
 *
 * `hasTime` vient du parseur, qui sait si le texte portait une heure. Le
 * déduire de la valeur revenait à confondre « minuit pile » avec « pas
 * d'heure », et « demain 0h » perdait la sienne — donc son rappel.
 */
function toStored(d: Date, hasTime: boolean): string {
  return hasTime ? toLocalISODateTime(d) : toLocalISODate(d);
}

export default function App() {
  const store = useTaskStore();
  const sync = useCloudSync({
    tasks: store.tasks,
    notes: store.notes,
    replaceAll: store.replaceAll,
  });
  const [tab, setTab] = useState<TabKey>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedUntil, setDismissedUntil] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  /** Tâche interrompue par un « Faire maintenant », à reprendre une fois l'urgence traitée. */
  const [resumeTaskId, setResumeTaskId] = useState<string | null>(null);
  /** Complétion en attente d'une confirmation (étapes restantes, sort de la note). */
  const [pendingComplete, setPendingComplete] = useState<{ id: string; step: CompleteStep } | null>(
    null
  );
  const addInputRef = useRef<HTMLInputElement>(null);

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

  // Horloge basse fréquence pour déclencher le bandeau d'échéance.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Capture externe : ?add=... (raccourci Siri, bouton Action, favori…)
  const { addTask } = store;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('add');
    if (!raw) return;
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    lines.forEach((line) => {
      const { cleanTitle, detectedDate, hasTime } = parseFrenchDate(line);
      addTask(cleanTitle || line, detectedDate ? toStored(detectedDate, hasTime) : null);
    });
    // On nettoie l'URL pour ne pas re-créer la tâche au rechargement.
    const url = new URL(window.location.href);
    url.searchParams.delete('add');
    window.history.replaceState({}, '', url.toString());
    if (lines.length) {
      setToast(lines.length > 1 ? `${lines.length} tâches ajoutées` : 'Tâche ajoutée');
    }
  }, [addTask]);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // La proposition d'annulation s'efface d'elle-même au bout de cinq secondes.
  const { clearUndo } = store;
  const undoId = store.undoState?.id;
  useEffect(() => {
    if (!undoId) return;
    const id = window.setTimeout(clearUndo, 5000);
    return () => window.clearTimeout(id);
  }, [undoId, clearUndo]);

  const stack = useMemo(
    () => buildStack(store.todayTasks, store.settings.pinnedTaskId),
    [store.todayTasks, store.settings.pinnedTaskId]
  );
  const currentTop = stack[0] ?? null;

  /**
   * Quand la tâche en cours sort de la pile (terminée, reportée, supprimée),
   * on revient sur celle qu'elle avait interrompue au lieu de retomber
   * sur une tâche au hasard.
   */
  const { updateSettings, todayTasks } = store;
  const pinnedTaskId = store.settings.pinnedTaskId;
  useEffect(() => {
    if (!pinnedTaskId) return;
    const stillActive = todayTasks.some((t) => t.id === pinnedTaskId && !t.completedDate);
    if (stillActive) return;
    const resume = resumeTaskId
      ? todayTasks.find((t) => t.id === resumeTaskId && !t.completedDate)
      : null;
    updateSettings({ pinnedTaskId: resume ? resume.id : null });
    setResumeTaskId(null);
    if (resume) setToast(`Retour à : ${resume.title}`);
  }, [todayTasks, pinnedTaskId, resumeTaskId, updateSettings]);

  // Tâche dont l'heure est arrivée et qui n'est pas déjà celle en cours.
  const dueTask = useMemo(() => {
    const due = store.tasks.filter((t) => {
      if (t.completedDate) return false;
      if (!t.scheduledDate || t.scheduledDate.length <= 10) return false;
      if (new Date(t.scheduledDate).getTime() > now) return false;
      if (currentTop && t.id === currentTop.id) return false;
      const until = dismissedUntil[t.id];
      if (until && until > now) return false;
      return true;
    });
    due.sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
    return due[0] ?? null;
  }, [store.tasks, now, dismissedUntil, currentTop]);

  // Raccourcis clavier (ordinateur).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) {
        if (e.key === 'Escape') (el as HTMLInputElement).blur();
        return;
      }
      if (e.key === '/' || e.key === 'n') {
        e.preventDefault();
        addInputRef.current?.focus();
      } else if (e.key === '1') setTab('today');
      else if (e.key === '2') setTab('cards');
      else if (e.key === '3') setTab('later');
      else if (e.key === '4') setTab('notes');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  /**
   * Passage obligé pour terminer une tâche, quel que soit l'endroit d'où on
   * clique : la carte comme la liste. On ne demande que ce qui s'applique.
   */
  const requestComplete = (id: string) => {
    const task = store.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.completedDate) {
      store.toggleComplete(id); // décocher : rien à confirmer
      return;
    }
    if ((task.subtasks ?? []).some((s) => !s.done)) {
      setPendingComplete({ id, step: 'subtasks' });
      return;
    }
    if ((task.note ?? '').trim()) {
      setPendingComplete({ id, step: 'note' });
      return;
    }
    store.completeTask(id, false);
  };

  const pendingTask = pendingComplete
    ? store.tasks.find((t) => t.id === pendingComplete.id) ?? null
    : null;

  const handleCompleteConfirm = (keepNote: boolean) => {
    if (!pendingComplete || !pendingTask) return;
    // Les étapes validées, on enchaîne sur le sort de la note s'il y en a une.
    if (pendingComplete.step === 'subtasks' && (pendingTask.note ?? '').trim()) {
      setPendingComplete({ id: pendingComplete.id, step: 'note' });
      return;
    }
    store.completeTask(pendingComplete.id, keepNote);
    setPendingComplete(null);
  };

  /** Depuis le paquet, ramène la tâche à aujourd'hui si besoin et la met en cours. */
  const handlePromoteToTop = (id: string) => {
    const task = store.tasks.find((t) => t.id === id);
    if (!task) return;
    const isLater = !!task.scheduledDate && task.scheduledDate.slice(0, 10) > toLocalISODate(new Date());
    if (isLater) store.bringToToday(id);
    // Choix délibéré depuis le paquet : ce n'est pas une interruption, on oublie la reprise.
    setResumeTaskId(null);
    store.updateSettings({ pinnedTaskId: id });
    setTab('cards');
  };

  /**
   * L'étoile de la carte : met la tâche en tête du paquet, ou l'en retire.
   *
   * `handlePromoteToTop` ne sait qu'épingler. Sans le retrait, l'étoile
   * s'allumait sans jamais pouvoir s'éteindre.
   *
   * Une seule tâche à la fois porte l'étoile : c'est le modèle existant, et
   * l'écran Cartes n'en montre qu'une de toute façon.
   */
  const handleTogglePin = (id: string) => {
    store.updateSettings({
      pinnedTaskId: store.settings.pinnedTaskId === id ? null : id,
    });
  };

  const handleDueDoNow = () => {
    if (!dueTask) return;
    setDismissedUntil((p) => ({ ...p, [dueTask.id]: FOREVER }));
    // On mémorise ce qu'on était en train de faire pour y revenir après.
    setResumeTaskId(currentTop && currentTop.id !== dueTask.id ? currentTop.id : null);
    store.updateSettings({ pinnedTaskId: dueTask.id });
    setTab('cards');
  };

  const handleDueFinishFirst = () => {
    if (!dueTask) return;
    setDismissedUntil((p) => ({ ...p, [dueTask.id]: FOREVER }));
    // La tâche se glisse juste derrière celle en cours. Si celle-ci est épinglée,
    // elle est de toute façon remontée en tête par buildStack : il suffit alors de
    // mettre la nouvelle en tête du tableau pour qu'elle devienne la carte n°2.
    const topIsPinned = !!currentTop && store.settings.pinnedTaskId === currentTop.id;
    store.placeAfterTask(dueTask.id, topIsPinned ? null : currentTop?.id ?? null);
    setToast('Placée juste après');
  };

  const handleDueSnooze = () => {
    if (!dueTask) return;
    setDismissedUntil((p) => ({ ...p, [dueTask.id]: Date.now() + SNOOZE_MS }));
  };

  return (
    <div className="app-shell flex flex-col">
      <BrandHeader />
      <main
        className={`flex-1 min-h-0 transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {tab === 'today' && (
          <TodayView
            tasks={store.todayTasks}
            onToggle={requestComplete}
            onDelete={store.deleteTask}
            onEditTitle={store.updateTaskTitle}
            onPin={store.pinTask}
            onClearCompleted={store.clearCompleted}
            pinnedTaskId={store.settings.pinnedTaskId}
          />
        )}
        {tab === 'later' && (
          <LaterView
            tasks={store.laterTasks}
            onToggle={store.toggleComplete}
            onDelete={store.deleteTask}
            onEditTitle={store.updateTaskTitle}
            onBringToToday={store.bringToToday}
          />
        )}
        {tab === 'cards' && (
          <CardsView
            todayTasks={store.todayTasks}
            laterTasks={store.laterTasks}
            pinnedTaskId={store.settings.pinnedTaskId}
            onComplete={requestComplete}
            onPostpone={store.postponeToTomorrow}
            onPromoteToTop={handlePromoteToTop}
            onReschedule={store.rescheduleTask}
            onTogglePin={handleTogglePin}
            onSetNote={store.setTaskNote}
            onAddSubtask={store.addSubtask}
            onToggleSubtask={store.toggleSubtask}
            onDeleteSubtask={store.deleteSubtask}
          />
        )}
        {tab === 'notes' && (
          <NotesView
            notes={store.notes}
            onAdd={store.addNote}
            onUpdate={store.updateNote}
            onDelete={store.deleteNote}
          />
        )}
      </main>

      <CompleteTaskDialog
        task={pendingTask}
        step={pendingComplete?.step ?? null}
        onConfirm={handleCompleteConfirm}
        onCancel={() => setPendingComplete(null)}
      />

      <DueTaskBanner
        task={dueTask}
        currentTitle={currentTop?.title ?? null}
        onDoNow={handleDueDoNow}
        onFinishFirst={handleDueFinishFirst}
        onSnooze={handleDueSnooze}
      />

      {/* Annulation prioritaire sur le toast simple : c'est la seule des deux qui agit. */}
      {store.undoState ? (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full bg-idayal-text text-white shadow-elev animate-slide-in-up"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 132px)' }}
        >
          <span className="text-[13px] font-medium whitespace-nowrap">{store.undoState.label}</span>
          <button
            type="button"
            onClick={store.undo}
            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-[13px] font-semibold whitespace-nowrap active:scale-95 transition"
          >
            Annuler
          </button>
        </div>
      ) : (
        toast && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-idayal-text text-white text-[13px] font-medium shadow-elev animate-slide-in-up"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 132px)' }}
          >
            {toast}
          </div>
        )
      )}

      {/* La barre de saisie est disponible partout : noter ne doit jamais demander de naviguer. */}
      <QuickAddBar onAdd={handleAdd} inputRef={addInputRef} />

      <TabBar active={tab} onChange={handleTab} onOpenSettings={() => setSettingsOpen(true)} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={store.settings}
        onUpdateSettings={store.updateSettings}
        onCleanCompleted={() => store.cleanOldCompleted(30)}
        onExport={store.exportJSON}
        onImport={store.importJSON}
        appVersion={APP_VERSION}
        sync={sync}
      />
    </div>
  );
}
