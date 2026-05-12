import { useMemo } from 'react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import type { Task } from '../types/task';

interface Props {
  task: Task;
  /** 0 = carte du dessus, 1 / 2 = cartes empilées en dessous. */
  depth: number;
  onDone: () => void;
  onPostpone: () => void;
}

export function SwipeCard({ task, depth, onDone, onPostpone }: Props) {
  const isTop = depth === 0;
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

  return (
    <div
      ref={ref}
      className="absolute inset-0 select-none"
      style={{ ...style, touchAction: isTop ? 'none' : 'auto' }}
    >
      <div className="relative w-full h-full bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-card shadow-card border border-idayal-border dark:border-idayal-border-dark flex flex-col p-7 overflow-hidden">
        {/* Subtle gradient accent en haut */}
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

        <div className="flex-1 flex flex-col items-center justify-center px-2">
          <p className="text-[26px] font-semibold text-center text-idayal-text dark:text-zinc-100 leading-snug tracking-tight2">
            {task.title || 'Tâche'}
          </p>
          {task.scheduledDate && task.scheduledDate.length > 10 && (
            <p className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 text-idayal-blue text-[13px] font-medium tabular">
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

        {/* Hints en bas — visibles uniquement sur la carte du dessus, au repos */}
        {isTop && doneOpacity === 0 && postponeOpacity === 0 && (
          <div className="absolute bottom-5 left-0 right-0 flex items-center justify-between px-6 text-[11px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500 pointer-events-none">
            <span className="flex items-center gap-1 text-idayal-orange/70">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Plus tard
            </span>
            <span className="flex items-center gap-1 text-idayal-green/70">
              Fait
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
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
