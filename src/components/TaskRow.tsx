import { useState } from 'react';
import type { Task } from '../types/task';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onBringToToday?: (id: string) => void;
  onPin?: (id: string) => void;
  isPinned?: boolean;
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

export function TaskRow({
  task,
  onToggle,
  onDelete,
  onBringToToday,
  onPin,
  isPinned = false,
  showDate = false,
}: Props) {
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
      setExiting(true);
      window.setTimeout(() => {
        onToggle(task.id);
        setExiting(false);
      }, 280);
    } else {
      onToggle(task.id);
    }
  };

  const dateLabel = formatScheduled(task.scheduledDate);
  const carried = task.isCarriedOver && !completed;

  return (
    <li
      className={`group relative flex items-start gap-3 pl-3 pr-3 py-3 mb-2 bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-row shadow-soft border animate-slide-in-up overflow-hidden transition-colors ${
        isPinned
          ? 'border-idayal-blue/50 dark:border-idayal-blue/60 shadow-[0_2px_8px_rgba(59,125,216,0.15)]'
          : 'border-idayal-border dark:border-idayal-border-dark'
      } ${exiting ? 'animate-slide-out-right' : ''}`}
    >
      {/* Accent latéral pour les tâches reportées ou épinglées */}
      {(carried || isPinned) && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-[3px] rounded-l-row ${
            isPinned ? 'bg-idayal-blue' : 'bg-idayal-orange'
          }`}
        />
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={completed ? 'Marquer non fait' : 'Marquer comme fait'}
        className={`mt-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          completed
            ? 'bg-idayal-green border-2 border-idayal-green shadow-[0_2px_8px_rgba(61,186,142,0.35)]'
            : 'bg-transparent border-2 border-zinc-300 dark:border-zinc-600 hover:border-idayal-blue active:scale-90'
        }`}
      >
        {completed && (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-pop"
          >
            <path d="M5 12.5l4.5 4.5L20 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {carried && (
            <span className="text-idayal-orange text-[11px] font-medium mt-0.5 leading-snug tabular flex items-center gap-0.5" title="Reportée">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
          )}
          {isPinned && (
            <span className="text-idayal-blue text-[11px] font-medium mt-0.5 leading-snug flex items-center gap-0.5" title="Prochaine carte">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" stroke="none">
                <path d="M12 2l2.4 6.9h7.2l-5.8 4.3 2.2 6.9L12 15.9l-6 4.2 2.2-6.9L2.4 8.9h7.2z" />
              </svg>
            </span>
          )}
          <p
            className={`text-[15px] leading-snug break-words tracking-tightish ${
              completed
                ? 'text-idayal-text-muted line-through'
                : 'text-idayal-text dark:text-zinc-100'
            }`}
          >
            {task.title}
          </p>
        </div>
        {showDate && dateLabel && !completed && (
          <p className="text-[12px] text-idayal-blue mt-0.5 tabular font-medium">
            {dateLabel}
          </p>
        )}
      </div>

      {/* Action de droite : bring-to-today (dans Plus tard) OU pin (dans Aujourd'hui) OU icône calendrier */}
      {!completed && onBringToToday && (
        <button
          type="button"
          onClick={() => onBringToToday(task.id)}
          aria-label="Faire aujourd'hui"
          title="Faire aujourd'hui"
          className="flex-shrink-0 h-8 px-3 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/20 text-idayal-blue text-[12px] font-semibold flex items-center gap-1.5 active:scale-95 hover:bg-idayal-blue/20 dark:hover:bg-idayal-blue/30 transition"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          Aujourd'hui
        </button>
      )}

      {!completed && onPin && !onBringToToday && (
        <button
          type="button"
          onClick={() => onPin(task.id)}
          aria-label={isPinned ? 'Retirer de la prochaine carte' : 'En faire la prochaine carte'}
          title={isPinned ? 'Retirer de la prochaine carte' : 'En faire la prochaine carte'}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90 ${
            isPinned
              ? 'bg-idayal-blue text-white shadow-[0_2px_8px_rgba(59,125,216,0.4)]'
              : 'text-idayal-text-muted hover:text-idayal-blue hover:bg-idayal-blue-soft dark:hover:bg-idayal-blue/20'
          }`}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 6.9h7.2l-5.8 4.3 2.2 6.9L12 15.9l-6 4.2 2.2-6.9L2.4 8.9h7.2z" />
          </svg>
        </button>
      )}

      {showDate && !onBringToToday && (
        <span className="mt-0.5 w-7 h-7 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 flex items-center justify-center text-idayal-blue flex-shrink-0">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
        </span>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-idayal-text-muted hover:text-red-500 transition flex-shrink-0 mt-0.5"
          aria-label="Supprimer"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </li>
  );
}
