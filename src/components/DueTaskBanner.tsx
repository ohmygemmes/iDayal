import type { Task } from '../types/task';

interface Props {
  task: Task | null;
  /** Titre de ce que l'utilisateur est en train de faire (carte du dessus). */
  currentTitle: string | null;
  onDoNow: () => void;
  onFinishFirst: () => void;
  onSnooze: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Bandeau qui surgit quand l'heure d'une tâche est arrivée.
 * Deux choix : la faire tout de suite, ou finir d'abord ce qui est en cours.
 */
export function DueTaskBanner({ task, currentTitle, onDoNow, onFinishFirst, onSnooze }: Props) {
  if (!task) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-40 px-4 pt-2 animate-slide-in-up">
      <div className="rounded-card bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev border border-idayal-orange/40 shadow-elev overflow-hidden">
        <div className="h-1 bg-idayal-orange" />
        <div className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 w-8 h-8 rounded-full bg-idayal-orange-soft dark:bg-idayal-orange/20 text-idayal-orange flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-idayal-orange tabular">
                {task.scheduledDate ? formatTime(task.scheduledDate) : "C'est l'heure"} · c'est
                l'heure
              </p>
              <p className="text-[16px] font-semibold text-idayal-text dark:text-zinc-100 leading-snug tracking-tightish mt-0.5 break-words">
                {task.title || 'Tâche'}
              </p>
            </div>
            <button
              type="button"
              onClick={onSnooze}
              aria-label="Rappeler dans 10 minutes"
              title="Rappeler dans 10 min"
              className="w-8 h-8 rounded-full text-idayal-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center flex-shrink-0 active:scale-90 transition"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onFinishFirst}
              className="flex-1 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-idayal-text dark:text-zinc-200 font-semibold text-[14px] active:scale-95 transition"
            >
              Je finis d'abord
            </button>
            <button
              type="button"
              onClick={onDoNow}
              className="flex-1 h-11 rounded-2xl bg-idayal-orange text-white font-semibold text-[14px] shadow-[0_6px_16px_rgba(240,138,27,0.35)] active:scale-95 transition"
            >
              Faire maintenant
            </button>
          </div>

          {currentTitle && (
            <p className="text-[11.5px] text-idayal-text-muted dark:text-zinc-500 mt-2 text-center truncate">
              En cours : {currentTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
