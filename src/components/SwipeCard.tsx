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
    <div ref={ref} className="absolute inset-0 select-none" style={style}>
      <div className="relative w-full h-full bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-black/5 dark:border-white/10 flex flex-col items-center justify-center p-8">
        {task.isCarriedOver && (
          <span className="absolute top-4 left-4 text-idayal-orange text-xs font-medium flex items-center gap-1">
            🕐 Reportée
          </span>
        )}
        <p className="text-2xl font-medium text-center text-idayal-text dark:text-zinc-100 leading-snug">
          {task.title}
        </p>
        {task.scheduledDate && task.scheduledDate.length > 10 && (
          <p className="mt-3 text-sm text-idayal-blue">
            {new Date(task.scheduledDate).toLocaleString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {/* Overlays */}
        <div
          className="absolute inset-0 rounded-3xl flex items-center justify-center bg-idayal-green/85 text-white text-3xl font-bold pointer-events-none"
          style={{ opacity: doneOpacity }}
        >
          Fait ✓
        </div>
        <div
          className="absolute inset-0 rounded-3xl flex items-center justify-center bg-idayal-orange/85 text-white text-3xl font-bold pointer-events-none"
          style={{ opacity: postponeOpacity }}
        >
          Plus tard ←
        </div>
      </div>
    </div>
  );
}
