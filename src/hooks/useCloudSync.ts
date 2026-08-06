import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cloudEnabled,
  getSession,
  onAuthChange,
  pull,
  push,
  type CloudState,
} from '../services/cloudSync';
import type { Note, Task } from '../types/task';

/** Horodatage de la dernière modification locale, pour arbitrer avec le distant. */
const EDITED_KEY = 'idayal:localEditedAt:v1';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';

interface Params {
  tasks: Task[];
  notes: Note[];
  /** Remplace l'état local par celui du serveur. */
  replaceAll: (tasks: Task[], notes: Note[]) => void;
}

export interface CloudSync {
  email: string | null;
  status: SyncStatus;
  lastError: string | null;
  lastSyncedAt: string | null;
  syncNow: () => void;
}

function readEditedAt(): number {
  const raw = localStorage.getItem(EDITED_KEY);
  return raw ? Number(raw) || 0 : 0;
}

/**
 * Synchronise l'état d'un utilisateur entre ses appareils.
 *
 * Modèle volontairement simple : l'état complet est écrit d'un bloc, et le plus
 * récent gagne. Pour une personne sur deux appareils, les modifications
 * simultanées sont rares ; un fusionnement ligne à ligne coûterait bien plus
 * cher en complexité qu'il ne rapporte ici.
 */
export function useCloudSync({ tasks, notes, replaceAll }: Params): CloudSync {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>(cloudEnabled ? 'idle' : 'off');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  /** Empreinte du dernier état échangé avec le serveur : évite les envois en boucle. */
  const syncedRef = useRef<string>('');
  /** Vrai pendant l'application d'un état distant, pour ne pas le réémettre. */
  const applyingRef = useRef(false);
  const pushTimer = useRef<number | null>(null);

  // Session courante.
  useEffect(() => {
    if (!cloudEnabled) return;
    let alive = true;
    getSession().then((s) => {
      if (!alive) return;
      setEmail(s?.user.email ?? null);
      setUserId(s?.user.id ?? null);
    });
    const off = onAuthChange((s) => {
      setEmail(s?.user.email ?? null);
      setUserId(s?.user.id ?? null);
      if (!s) {
        syncedRef.current = '';
        setLastSyncedAt(null);
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  const serialize = useCallback(
    () => JSON.stringify({ tasks, notes } satisfies CloudState),
    [tasks, notes]
  );

  /** Confronte local et distant, puis adopte l'un ou envoie l'autre. */
  const reconcile = useCallback(async () => {
    if (!userId) return;
    setStatus('syncing');
    setLastError(null);
    try {
      const remote = await pull();
      const localJson = JSON.stringify({ tasks, notes } satisfies CloudState);

      if (!remote) {
        const at = await push(userId, { tasks, notes });
        syncedRef.current = localJson;
        setLastSyncedAt(at);
        setStatus('idle');
        return;
      }

      const remoteJson = JSON.stringify(remote.data);
      if (remoteJson === localJson) {
        syncedRef.current = localJson;
        setLastSyncedAt(remote.updatedAt);
        setStatus('idle');
        return;
      }

      const remoteAt = new Date(remote.updatedAt).getTime();
      if (remoteAt > readEditedAt()) {
        // Le serveur est en avance : on adopte, sans réémettre derrière.
        applyingRef.current = true;
        syncedRef.current = remoteJson;
        replaceAll(remote.data.tasks, remote.data.notes);
        setLastSyncedAt(remote.updatedAt);
      } else {
        const at = await push(userId, { tasks, notes });
        syncedRef.current = localJson;
        setLastSyncedAt(at);
      }
      setStatus('idle');
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [userId, tasks, notes, replaceAll]);

  // Réconciliation à la connexion, au retour sur l'app et au retour du réseau.
  useEffect(() => {
    if (!userId) return;
    reconcile();
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconcile();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', reconcile);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', reconcile);
    };
    // `reconcile` change à chaque modification locale ; on ne veut relancer
    // que sur un changement de compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Envoi différé après une modification locale.
  useEffect(() => {
    if (!userId) return;
    const json = serialize();

    if (applyingRef.current) {
      // État reçu du serveur : on ne le renvoie pas.
      applyingRef.current = false;
      return;
    }
    if (json === syncedRef.current) return;

    localStorage.setItem(EDITED_KEY, String(Date.now()));

    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(async () => {
      try {
        setStatus('syncing');
        const at = await push(userId, JSON.parse(json) as CloudState);
        syncedRef.current = json;
        setLastSyncedAt(at);
        setStatus('idle');
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    }, 1500);

    return () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [serialize, userId]);

  return { email, status, lastError, lastSyncedAt, syncNow: () => void reconcile() };
}
