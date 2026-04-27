import { useMemo } from 'react';
import type { Task } from '../types/task';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

function formatTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function TodayView({ tasks, onToggle, onDelete, onOpenSettings }: Props) {
  const { carried, fresh, done } = useMemo(() => {
    const carried = tasks.filter((t) => !t.completedDate && t.isCarriedOver);
    const fresh = tasks.filter((t) => !t.completedDate && !t.isCarriedOver);
    const done = tasks.filter((t) => !!t.completedDate);
    return { carried, fresh, done };
  }, [tasks]);

  const remaining = carried.length + fresh.length;

  return (
    <div className="flex flex-col h-full">
      <header
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div>
          <h1 className="text-2xl font-semibold text-idayal-text dark:text-zinc-100 capitalize">
            Aujourd'hui
          </h1>
          <p className="text-sm text-idayal-text-secondary dark:text-zinc-400 capitalize">
            {formatTodayLabel()} · {remaining} restante{remaining !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 flex items-center justify-center text-idayal-text-secondary dark:text-zinc-300 active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-44">
        {tasks.length === 0 && (
          <div className="text-center text-idayal-text-secondary dark:text-zinc-400 mt-16 px-6">
            <div className="text-4xl mb-3">🌤</div>
            <p className="text-base">Rien pour aujourd'hui.</p>
            <p className="text-sm mt-1">Tape une tâche en bas — par exemple « courses demain ».</p>
          </div>
        )}

        <ul>
          {carried.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
          ))}
          {fresh.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </ul>

        {done.length > 0 && (
          <>
            <h2 className="mt-6 mb-2 px-1 text-xs uppercase tracking-wide text-idayal-text-secondary dark:text-zinc-500">
              Fait — {done.length}
            </h2>
            <ul>
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
