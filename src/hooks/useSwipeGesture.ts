import { useCallback, useEffect, useRef, useState } from 'react';

export interface SwipeState {
  dx: number;
  dy: number;
  active: boolean;
}

interface Options {
  /** Seuil en pixels au-delà duquel on déclenche right/left. Si non fourni, calculé à 40% de la largeur de fenêtre. */
  threshold?: number;
  /** Désactiver les listeners (par ex. carte derrière la pile). */
  enabled?: boolean;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

/**
 * Hook de drag horizontal en touch events natifs.
 * Renvoie une ref à attacher à l'élément + l'état du drag.
 */
export function useSwipeGesture<T extends HTMLElement>(opts: Options) {
  const { threshold, onSwipeRight, onSwipeLeft, enabled = true } = opts;
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<SwipeState>({ dx: 0, dy: 0, active: false });

  // On garde les callbacks dans une ref pour éviter de re-binder les listeners.
  const cbRef = useRef({ onSwipeRight, onSwipeLeft, threshold });
  cbRef.current = { onSwipeRight, onSwipeLeft, threshold };

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const lastRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const reset = useCallback(() => {
    setState({ dx: 0, dy: 0, active: false });
    startRef.current = null;
    draggingRef.current = false;
    lastRef.current = { dx: 0, dy: 0 };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY };
      draggingRef.current = true;
      lastRef.current = { dx: 0, dy: 0 };
      setState({ dx: 0, dy: 0, active: true });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current || !startRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;
      // Si le geste est principalement vertical au début, on laisse passer le scroll.
      if (Math.abs(dx) < 8 && Math.abs(dy) > 12) {
        draggingRef.current = false;
        reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      lastRef.current = { dx, dy };
      setState({ dx, dy, active: true });
    };

    const onTouchEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const limit = cbRef.current.threshold ?? Math.min(window.innerWidth * 0.4, 180);
      const { dx } = lastRef.current;
      if (dx > limit) cbRef.current.onSwipeRight?.();
      else if (dx < -limit) cbRef.current.onSwipeLeft?.();
      setState({ dx: 0, dy: 0, active: false });
      startRef.current = null;
      lastRef.current = { dx: 0, dy: 0 };
    };

    const onTouchCancel = () => reset();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [reset, enabled]);

  return { ref, state, reset };
}
