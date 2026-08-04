import { useMemo } from 'react';
import type { Task } from '../types/task';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
  onPin: (id: string) => void;
  pinnedTaskId: string | null;
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

export function TodayView({ tasks, onToggle, onDelete, onEditTitle, onPin, pinnedTaskId }: Props) {
  const { carried, fresh, done } = useMemo(() => {
    const carried = tasks.filter((t) => !t.completedDate && t.isCarriedOver);
    const fresh = tasks.filter((t) => !t.completedDate && !t.isCarriedOver);
    const done = tasks.filter((t) => !!t.completedDate);
    return { carried, fresh, done };
  }, [tasks]);

  const remaining = carried.length + fresh.length;

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-2 pb-3">
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
            <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEditTitle={onEditTitle} onPin={onPin} isPinned={pinnedTaskId === t.id} />
          ))}
          {fresh.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEditTitle={onEditTitle} onPin={onPin} isPinned={pinnedTaskId === t.id} />
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
                <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEditTitle={onEditTitle} onPin={onPin} isPinned={pinnedTaskId === t.id} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
