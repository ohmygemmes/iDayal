/**
 * Chrono et minuteur d'une tâche.
 *
 * **Rien ne compte de battements.** Une vue web suspend ses minuteries dès que
 * l'application passe en arrière-plan : un compteur incrémenté chaque seconde
 * s'arrêterait avec l'écran et mentirait au retour. On ne retient donc que des
 * instants, et la durée se déduit par soustraction — même raisonnement que pour
 * `updatedAt` dans la synchronisation, qui est un moment et non une date.
 *
 * **Une seule minuterie à la fois.** L'écran Cartes montre une tâche à la fois ;
 * deux chronos parallèles n'auraient aucun sens sur un outil de concentration.
 *
 * **Rien n'est synchronisé.** Une minuterie en cours appartient à l'appareil qui
 * l'a lancée. L'envoyer au serveur ferait écrire à chaque seconde et ferait
 * apparaître un compte à rebours sur un téléphone posé dans une autre pièce.
 */
export type TimerMode = 'up' | 'down';

export interface RunningTimer {
  taskId: string;
  mode: TimerMode;
  /** Durée choisie, en millisecondes. Ignorée en mode « chrono ». */
  durationMs: number;
  /** Millisecondes accumulées par les périodes déjà arrêtées. */
  elapsedBefore: number;
  /** Début de la période en cours, ou `null` si en pause. */
  startedAt: number | null;
}

export function isRunning(t: RunningTimer): boolean {
  return t.startedAt !== null;
}

/** Temps écoulé depuis le premier démarrage, pauses déduites. */
export function elapsed(t: RunningTimer, now: number): number {
  const current = t.startedAt === null ? 0 : Math.max(0, now - t.startedAt);
  return t.elapsedBefore + current;
}

/** Temps restant d'un compte à rebours. Jamais négatif. */
export function remaining(t: RunningTimer, now: number): number {
  return Math.max(0, t.durationMs - elapsed(t, now));
}

/** Un compte à rebours arrivé à zéro. Un chrono ne finit jamais. */
export function isFinished(t: RunningTimer, now: number): boolean {
  return t.mode === 'down' && remaining(t, now) === 0;
}

/** Ce que la carte affiche : le temps couru, ou celui qui reste. */
export function displayedMs(t: RunningTimer, now: number): number {
  return t.mode === 'down' ? remaining(t, now) : elapsed(t, now);
}

export function create(taskId: string, mode: TimerMode, durationMs = 0): RunningTimer {
  return { taskId, mode, durationMs, elapsedBefore: 0, startedAt: null };
}

export function start(t: RunningTimer, now: number): RunningTimer {
  return isRunning(t) ? t : { ...t, startedAt: now };
}

export function pause(t: RunningTimer, now: number): RunningTimer {
  if (!isRunning(t)) return t;
  return { ...t, elapsedBefore: elapsed(t, now), startedAt: null };
}

export function toggle(t: RunningTimer, now: number): RunningTimer {
  return isRunning(t) ? pause(t, now) : start(t, now);
}

/**
 * Change de mode. Le compteur repart de zéro : le temps couru d'un chrono ne
 * veut rien dire une fois converti en compte à rebours, et l'inverse non plus.
 */
export function withMode(t: RunningTimer, mode: TimerMode, durationMs: number): RunningTimer {
  return { ...t, mode, durationMs, elapsedBefore: 0, startedAt: null };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * `12:47` sous l'heure, `01:12:47` au-delà.
 *
 * Un compte à rebours de vingt-cinq minutes affiché `00:25:00` fait lire trois
 * nombres pour en comprendre un seul. Les heures n'apparaissent que lorsqu'il y
 * en a.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

const KEY = 'idayal:timer:v1';

export function loadTimer(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as RunningTimer;
    // Une entrée abîmée ne doit pas bloquer l'écran : on repart de rien.
    if (typeof t?.taskId !== 'string' || (t.mode !== 'up' && t.mode !== 'down')) return null;
    return t;
  } catch {
    return null;
  }
}

export function saveTimer(t: RunningTimer | null): void {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage plein ou refusé : la minuterie vit alors le temps de la session */
  }
}
