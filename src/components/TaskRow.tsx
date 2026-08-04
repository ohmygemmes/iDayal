import { useEffect, useRef, useState } from 'react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import type { Task } from '../types/task';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEditTitle?: (id: string, title: string) => void;
  onBringToToday?: (id: string) => void;
  onPin?: (id: string) => void;
  isPinned?: boolean;
  showDate?: boolean;
}

interface ScheduleInfo {
  label: string;
  hasTime: boolean;
  overdue: boolean;
}

/**
 * Dans « Plus tard » on affiche la date complète.
 * Dans « Aujourd'hui » la date est évidente : on n'affiche que l'heure, si elle existe.
 */
function scheduleInfo(iso: string | null, showFullDate: boolean): ScheduleInfo | null {
  if (!iso) return null;
  const hasTime = iso.length > 10;
  if (!showFullDate && !hasTime) return null;
  const d = hasTime ? new Date(iso) : new Date(iso + 'T00:00:00');
  const label = showFullDate
    ? d.toLocaleString(
        'fr-FR',
        hasTime
          ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
          : { weekday: 'short', day: 'numeric', month: 'short' }
      )
    : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { label, hasTime, overdue: hasTime && d.getTime() < Date.now() };
}

/** Distance de glissement au-delà de laquelle on supprime. */
const DELETE_THRESHOLD = 96;

export function TaskRow({
  task,
  onToggle,
  onDelete,
  onEditTitle,
  onBringToToday,
  onPin,
  isPinned = false,
  showDate = false,
}: Props) {
  const [exiting, setExiting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const editRef = useRef<HTMLInputElement>(null);
  const completed = !!task.completedDate;

  const removeWithAnimation = () => {
    if (!onDelete) return;
    setExiting(true);
    window.setTimeout(() => onDelete(task.id), 260);
  };

  // Glisser vers la gauche supprime. Le geste est désactivé pendant l'édition.
  const { ref: swipeRef, state: swipe } = useSwipeGesture<HTMLLIElement>({
    enabled: !!onDelete && !editing && !exiting,
    threshold: DELETE_THRESHOLD,
    onSwipeLeft: () => {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
      removeWithAnimation();
    },
  });

  useEffect(() => {
    if (editing) {
      setDraft(task.title);
      // Laisse le temps au champ d'être monté avant de le sélectionner.
      window.setTimeout(() => {
        editRef.current?.focus();
        editRef.current?.select();
      }, 0);
    }
  }, [editing, task.title]);

  const commitEdit = () => {
    const next = draft.trim();
    if (next && next !== task.title) onEditTitle?.(task.id, next);
    setEditing(false);
  };

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

  const schedule = scheduleInfo(task.scheduledDate, showDate);
  const carried = task.isCarriedOver && !completed;

  // On ne suit le doigt que vers la gauche.
  const dx = Math.min(0, swipe.dx);
  const revealed = Math.min(1, -dx / DELETE_THRESHOLD);

  return (
    <li
      ref={swipeRef}
      className={`relative mb-2 rounded-row overflow-hidden ${
        exiting ? 'animate-slide-out-right' : ''
      }`}
    >
      {/* Fond de suppression, révélé par le glissement */}
      {onDelete && dx < 0 && (
        <div
          className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5 rounded-row"
          style={{ opacity: 0.35 + revealed * 0.65 }}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `scale(${0.8 + revealed * 0.3})` }}
          >
            <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
          </svg>
        </div>
      )}

      <div
        className={`group relative flex items-start gap-3 pl-3 pr-3 py-3 bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-row shadow-soft border animate-slide-in-up ${
          isPinned
            ? 'border-idayal-blue/50 dark:border-idayal-blue/60 shadow-[0_2px_8px_rgba(59,125,216,0.15)]'
            : 'border-idayal-border dark:border-idayal-border-dark'
        }`}
        style={{
          transform: `translateX(${dx}px)`,
          transition: swipe.active ? 'none' : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Accent latéral pour les tâches reportées ou en cours */}
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
          {editing ? (
            <input
              ref={editRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              className="w-full bg-transparent outline-none text-[15px] leading-snug tracking-tightish text-idayal-text dark:text-zinc-100 border-b-2 border-idayal-blue pb-0.5"
              enterKeyHint="done"
              autoComplete="off"
            />
          ) : (
            <div className="flex items-start gap-1.5">
              {carried && (
                <span
                  className="text-idayal-orange text-[11px] font-medium mt-0.5 leading-snug flex items-center gap-0.5"
                  title="Reportée"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
              )}
              {isPinned && (
                <span
                  className="text-idayal-blue text-[11px] font-medium mt-0.5 leading-snug flex items-center gap-0.5"
                  title="En cours"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" stroke="none">
                    <path d="M12 2l2.4 6.9h7.2l-5.8 4.3 2.2 6.9L12 15.9l-6 4.2 2.2-6.9L2.4 8.9h7.2z" />
                  </svg>
                </span>
              )}
              <p
                onClick={() => {
                  if (onEditTitle && !completed) setEditing(true);
                }}
                className={`text-[15px] leading-snug break-words tracking-tightish ${
                  onEditTitle && !completed ? 'cursor-text' : ''
                } ${
                  completed
                    ? 'text-idayal-text-muted line-through'
                    : 'text-idayal-text dark:text-zinc-100'
                }`}
              >
                {task.title}
              </p>
            </div>
          )}

          {schedule && !completed && !editing && (
            <p
              className={`text-[12px] mt-0.5 tabular font-medium flex items-center gap-1 ${
                schedule.overdue ? 'text-idayal-orange' : 'text-idayal-blue'
              }`}
            >
              {schedule.hasTime && (
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )}
              {schedule.label}
            </p>
          )}
        </div>

        {!completed && !editing && onBringToToday && (
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

        {!completed && !editing && onPin && !onBringToToday && (
          <button
            type="button"
            onClick={() => onPin(task.id)}
            aria-label={isPinned ? 'Ne plus faire ça maintenant' : 'Je fais ça maintenant'}
            title={isPinned ? 'Ne plus faire ça maintenant' : 'Je fais ça maintenant'}
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

        {showDate && !onBringToToday && !editing && (
          <span className="mt-0.5 w-7 h-7 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 flex items-center justify-center text-idayal-blue flex-shrink-0">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
          </span>
        )}

        {/* Suppression à la souris. Au doigt, on glisse la ligne vers la gauche. */}
        {onDelete && !editing && (
          <button
            type="button"
            onClick={removeWithAnimation}
            className="mouse-only opacity-0 group-hover:opacity-100 focus:opacity-100 text-idayal-text-muted hover:text-red-500 transition flex-shrink-0 mt-0.5 items-center justify-center"
            aria-label="Supprimer"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}
