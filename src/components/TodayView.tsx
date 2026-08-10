import { useMemo } from 'react';
import type { Task } from '../types/task';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
  onPin: (id: string) => void;
  onClearCompleted: () => void;
  pinnedTaskId: string | null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Le jour d'un côté, le quantième de l'autre.
 *
 * La date est devenue le titre de l'écran : « Aujourd'hui » n'apprenait rien que
 * l'onglet actif ne disait déjà. Les deux morceaux sont séparés pour que le jour
 * porte le poids et que le quantième reste en second plan.
 */
function todayParts(): { weekday: string; rest: string } {
  const d = new Date();
  return {
    weekday: capitalize(d.toLocaleDateString('fr-FR', { weekday: 'long' })),
    rest: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
  };
}

export function TodayView({
  tasks,
  onToggle,
  onDelete,
  onEditTitle,
  onPin,
  onClearCompleted,
  pinnedTaskId,
}: Props) {
  const { pending, carriedCount, done } = useMemo(() => {
    const carried = tasks.filter((t) => !t.completedDate && t.isCarriedOver);
    const fresh = tasks.filter((t) => !t.completedDate && !t.isCarriedOver);
    const done = tasks.filter((t) => !!t.completedDate);

    /*
     * Ce qui porte une heure vient d'abord, dans l'ordre du jour ; le reste suit.
     *
     * Sans ce tri, la gouttière d'heure afficherait 12:00 au-dessus de 09:00 :
     * une colonne de chiffres dans le désordre se lit comme un défaut, pas comme
     * une liste. Une date nue ne compte pas — seule une heure situe dans la journée.
     */
    const atMinute = (t: Task): number => {
      const s = t.scheduledDate;
      if (!s || s.length <= 10) return Number.POSITIVE_INFINITY;
      const ms = new Date(s).getTime();
      return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
    };

    // `sort` est stable : à défaut d'heure, les reportées restent devant les neuves.
    const pending = [...carried, ...fresh].sort((a, b) => atMinute(a) - atMinute(b));

    return { pending, carriedCount: carried.length, done };
  }, [tasks]);

  const remaining = pending.length;
  const day = todayParts();

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-2 pb-3">
        <h1 className="text-[28px] font-bold text-idayal-text dark:text-zinc-100 tracking-tight2 leading-[1.05]">
          {day.weekday}{' '}
          <span className="font-medium text-idayal-text-muted dark:text-zinc-500">
            {day.rest}
          </span>
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
              {carriedCount > 0 && (
                <span className="text-idayal-orange">
                  {' '}· {carriedCount} report{carriedCount > 1 ? 's' : ''}
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
          {pending.map((t) => (
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
              <button
                type="button"
                onClick={onClearCompleted}
                className="text-[11px] font-semibold text-idayal-text-muted hover:text-red-500 flex items-center gap-1 px-1.5 py-1 rounded-md active:scale-95 transition"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
                </svg>
                Effacer
              </button>
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
