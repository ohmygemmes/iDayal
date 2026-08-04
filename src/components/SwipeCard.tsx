import { useEffect, useMemo, useRef, useState } from 'react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import type { Task } from '../types/task';

interface Props {
  task: Task;
  /** 0 = carte du dessus, 1 / 2 = cartes empilées en dessous. */
  depth: number;
  onDone: () => void;
  onPostpone: () => void;
  onSetNote?: (text: string) => void;
  onAddSubtask?: (title: string) => void;
  onToggleSubtask?: (subId: string) => void;
  onDeleteSubtask?: (subId: string) => void;
}

/**
 * Isole une zone interactive du geste de balayage. Le listener natif posé ici
 * s'exécute avant celui de la carte (qui est un ancêtre), donc arrêter la
 * propagation empêche la carte de partir quand on écrit dedans.
 */
function useSwallowTouch<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('touchstart', stop);
    el.addEventListener('touchmove', stop);
    el.addEventListener('touchend', stop);
    return () => {
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('touchend', stop);
    };
  }, []);
  return ref;
}

export function SwipeCard({
  task,
  depth,
  onDone,
  onPostpone,
  onSetNote,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: Props) {
  const isTop = depth === 0;
  const [noteOpen, setNoteOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [subDraft, setSubDraft] = useState('');
  const panelRef = useSwallowTouch<HTMLDivElement>();
  const subInputRef = useRef<HTMLInputElement>(null);

  const { ref, state } = useSwipeGesture<HTMLDivElement>({
    enabled: isTop,
    onSwipeRight: () => {
      try {
        navigator.vibrate?.(15);
      } catch {
        /* ignore */
      }
      onDone();
    },
    onSwipeLeft: () => {
      try {
        navigator.vibrate?.(10);
      } catch {
        /* ignore */
      }
      onPostpone();
    },
  });

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const limit = Math.min(screenW * 0.4, 180);

  const style = useMemo(() => {
    if (!isTop) {
      const scale = depth === 1 ? 0.96 : 0.92;
      const opacity = depth === 1 ? 0.6 : 0.4;
      const yOffset = depth * 10;
      return {
        transform: `translateY(${yOffset}px) scale(${scale})`,
        opacity,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
        zIndex: 10 - depth,
      } as React.CSSProperties;
    }
    const rot = Math.max(-15, Math.min(15, (state.dx / screenW) * 30));
    return {
      transform: `translate(${state.dx}px, ${state.dy * 0.2}px) rotate(${rot}deg)`,
      transition: state.active ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 20,
    } as React.CSSProperties;
  }, [depth, isTop, state.active, state.dx, state.dy, screenW]);

  const doneOpacity = isTop ? Math.max(0, Math.min(1, state.dx / limit)) : 0;
  const postponeOpacity = isTop ? Math.max(0, Math.min(1, -state.dx / limit)) : 0;

  const subtasks = task.subtasks ?? [];
  const note = task.note ?? '';
  const doneSubs = subtasks.filter((s) => s.done).length;

  const submitSubtask = () => {
    const v = subDraft.trim();
    if (!v) return;
    onAddSubtask?.(v);
    setSubDraft('');
    subInputRef.current?.focus();
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 select-none"
      style={{ ...style, touchAction: isTop ? 'none' : 'auto' }}
    >
      <div className="relative w-full h-full bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-card shadow-card border border-idayal-border dark:border-idayal-border-dark flex flex-col p-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(59, 125, 216, 0.08), transparent 70%)',
          }}
        />

        {task.isCarriedOver && (
          <span className="relative inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-idayal-orange-soft dark:bg-idayal-orange/15 text-idayal-orange text-[11px] font-semibold uppercase tracking-[0.06em]">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Reportée
          </span>
        )}

        {/* Titre */}
        <div className="relative flex flex-col items-center justify-center px-2 pt-3 pb-2">
          <p className="text-[24px] font-semibold text-center text-idayal-text dark:text-zinc-100 leading-snug tracking-tight2">
            {task.title || 'Tâche'}
          </p>
          {task.scheduledDate && task.scheduledDate.length > 10 && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 text-idayal-blue text-[13px] font-medium tabular">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {new Date(task.scheduledDate).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Étapes et note — zone interactive, hors du geste de balayage */}
        {isTop && (
          <div
            ref={panelRef}
            className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar"
            style={{ touchAction: 'pan-y' }}
          >
            {subtasks.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500">
                    Étapes
                  </span>
                  <span className="text-[10.5px] font-semibold text-idayal-green tabular">
                    {doneSubs}/{subtasks.length}
                  </span>
                  <span className="flex-1 h-px bg-idayal-border dark:bg-idayal-border-dark" />
                </div>
                <ul className="space-y-1">
                  {subtasks.map((s) => (
                    <li key={s.id} className="group flex items-center gap-2.5 px-1 py-1">
                      <button
                        type="button"
                        onClick={() => onToggleSubtask?.(s.id)}
                        aria-label={s.done ? 'Décocher' : 'Cocher'}
                        className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                          s.done
                            ? 'bg-idayal-green border-idayal-green'
                            : 'border-zinc-300 dark:border-zinc-600 active:scale-90'
                        }`}
                      >
                        {s.done && (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L20 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-[14px] leading-snug break-words ${
                          s.done
                            ? 'text-idayal-text-muted line-through'
                            : 'text-idayal-text dark:text-zinc-200'
                        }`}
                      >
                        {s.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSubtask?.(s.id)}
                        aria-label="Retirer l'étape"
                        className="mouse-only opacity-0 group-hover:opacity-100 text-idayal-text-muted hover:text-red-500 transition"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {subOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSubtask();
                }}
                className="flex items-center gap-2 px-1 mb-2"
              >
                <span className="w-[18px] h-[18px] rounded-md border-2 border-dashed border-idayal-blue/50 flex-shrink-0" />
                <input
                  ref={subInputRef}
                  autoFocus
                  value={subDraft}
                  onChange={(e) => setSubDraft(e.target.value)}
                  onBlur={() => {
                    submitSubtask();
                    setSubOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSubDraft('');
                      setSubOpen(false);
                    }
                  }}
                  placeholder="Une étape…"
                  className="flex-1 bg-transparent outline-none text-[14px] text-idayal-text dark:text-zinc-100 border-b border-idayal-blue/40 pb-0.5"
                  enterKeyHint="done"
                />
              </form>
            )}

            {(noteOpen || note) && (
              <div className="px-1 mb-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500">
                    Note
                  </span>
                  <span className="flex-1 h-px bg-idayal-border dark:bg-idayal-border-dark" />
                </div>
                <textarea
                  value={note}
                  autoFocus={noteOpen && !note}
                  onChange={(e) => onSetNote?.(e.target.value)}
                  onBlur={() => setNoteOpen(false)}
                  placeholder="Ce que tu veux retenir…"
                  rows={3}
                  className="w-full resize-none bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-400/20 rounded-row p-2.5 text-[14px] leading-snug text-idayal-text dark:text-zinc-200 outline-none focus:border-amber-400/60 placeholder:text-idayal-text-muted"
                />
              </div>
            )}
          </div>
        )}

        {/* Ajouts rapides */}
        {isTop && (
          <div className="relative flex gap-2 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setSubOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 text-idayal-text-secondary dark:text-zinc-300 text-[12.5px] font-semibold active:scale-95 hover:text-idayal-blue transition"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Étape
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 text-idayal-text-secondary dark:text-zinc-300 text-[12.5px] font-semibold active:scale-95 hover:text-idayal-blue transition"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4h11l4 4v12H5z" />
                <path d="M9 12h6M9 16h4" />
              </svg>
              Note
            </button>
          </div>
        )}

        {/* Actions cliquables — indispensables sur ordinateur */}
        {isTop && (
          <div className="relative flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  navigator.vibrate?.(10);
                } catch {
                  /* ignore */
                }
                onPostpone();
              }}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-idayal-orange-soft dark:bg-idayal-orange/15 text-idayal-orange font-semibold text-[15px] active:scale-95 hover:bg-idayal-orange/20 dark:hover:bg-idayal-orange/25 transition"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Plus tard
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  navigator.vibrate?.(15);
                } catch {
                  /* ignore */
                }
                onDone();
              }}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-idayal-green text-white font-semibold text-[15px] shadow-[0_6px_16px_rgba(61,186,142,0.35)] active:scale-95 hover:bg-idayal-green-dark transition"
            >
              Fait
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L20 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Overlays swipe */}
        <div
          className="absolute inset-0 rounded-card flex flex-col items-center justify-center bg-idayal-green/92 text-white pointer-events-none"
          style={{ opacity: doneOpacity }}
        >
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L20 7" />
          </svg>
          <span className="mt-2 text-2xl font-bold tracking-tight2">Fait</span>
        </div>
        <div
          className="absolute inset-0 rounded-card flex flex-col items-center justify-center bg-idayal-orange/92 text-white pointer-events-none"
          style={{ opacity: postponeOpacity }}
        >
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="mt-2 text-2xl font-bold tracking-tight2">Plus tard</span>
        </div>
      </div>
    </div>
  );
}
