import { useMemo } from 'react';
import type { Task } from '../types/task';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTodayLabel(): string {
  const d = new Date();
  return capitalize(
    d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  );
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
        className="flex items-end justify-between px-5 pt-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div>
          <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500 mb-0.5">
            {formatTodayLabel()}
          </p>
          <h1 className="text-[28px] font-bold text-idayal-text dark:text-zinc-100 tracking-tight2 leading-none">
            Aujourd'hui
          </h1>
          <p className="text-[13px] text-idayal-text-secondary dark:text-zinc-400 mt-1.5">
            {remaining === 0 ? (
              <span>Aucune tâche en attente</span>
            ) : (
              <span>
                <span className="tabular font-semibold text-idayal-text dark:text-zinc-200">
                  {remaining}
                </span>{' '}
                à faire
                {carried.length > 0 && (
                  <span className="text-idayal-orange">
                    {' '}· {carried.length} report{carried.length > 1 ? 's' : ''}
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="w-10 h-10 rounded-full bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev border border-idayal-border dark:border-idayal-border-dark shadow-soft flex items-center justify-center text-idayal-text-secondary dark:text-zinc-300 active:scale-90 transition"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-48">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center text-center mt-20 px-6">
            <div className="w-16 h-16 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 flex items-center justify-center text-3xl mb-4">
              ☀️
            </div>
            <p className="text-[17px] font-semibold text-idayal-text dark:text-zinc-100">
              Journée libre
            </p>
            <p className="text-[13px] text-idayal-text-secondary dark:text-zinc-400 mt-1 max-w-[260px]">
              Tape une tâche en bas — par ex.{' '}
              <span className="text-idayal-blue font-medium">« courses demain à 10h »</span>.
            </p>
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
            <div className="mt-7 mb-2 px-1 flex items-center gap-2">
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500">
                Fait
              </h2>
              <span className="text-[11px] font-semibold text-idayal-green tabular">
                {done.length}
              </span>
              <span className="flex-1 h-px bg-idayal-border dark:bg-idayal-border-dark" />
            </div>
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
