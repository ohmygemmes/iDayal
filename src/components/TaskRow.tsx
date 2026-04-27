import { useState } from 'react';
import type { Task } from '../types/task';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

function formatScheduled(iso: string | null): string | null {
  if (!iso) return null;
  const hasTime = iso.length > 10;
  const d = hasTime ? new Date(iso) : new Date(iso + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = hasTime
    ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { weekday: 'short', day: 'numeric', month: 'short' };
  return d.toLocaleString('fr-FR', opts);
}

export function TaskRow({ task, onToggle, onDelete, showDate = false }: Props) {
  const [exiting, setExiting] = useState(false);
  const completed = !!task.completedDate;

  const handleToggle = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }
    if (!completed) {
      // Animation slide-out avant complétion réelle.
      setExiting(true);
      window.setTimeout(() => {
        onToggle(task.id);
        setExiting(false);
      }, 250);
    } else {
      onToggle(task.id);
    }
  };

  const dateLabel = formatScheduled(task.scheduledDate);

  return (
    <li
      className={`group relative flex items-start gap-3 px-3 py-3 mb-2 bg-white dark:bg-zinc-900/70 rounded-row shadow-sm animate-slide-in-up ${
        task.isCarriedOver && !completed ? 'border-l-4 border-idayal-orange' : ''
      } ${exiting ? 'animate-slide-out-right' : ''}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-label={completed ? 'Marquer non fait' : 'Marquer comme fait'}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          completed
            ? 'bg-idayal-green border-idayal-green'
            : 'border-zinc-300 dark:border-zinc-600 active:scale-90'
        }`}
      >
        {completed && (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-pop"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {task.isCarriedOver && !completed && (
            <span className="text-idayal-orange text-sm" title="Reportée">
              🕐
            </span>
          )}
          <p
            className={`text-[15px] leading-snug break-words ${
              completed
                ? 'text-idayal-text-secondary line-through'
                : 'text-idayal-text dark:text-zinc-100'
            }`}
          >
            {task.title}
          </p>
        </div>
        {showDate && dateLabel && !completed && (
          <p className="text-xs text-idayal-blue mt-0.5">{dateLabel}</p>
        )}
      </div>

      {showDate && (
        <svg
          className="text-idayal-blue/70 mt-0.5"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-idayal-text-secondary hover:text-red-500 transition"
          aria-label="Supprimer"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </li>
  );
}
