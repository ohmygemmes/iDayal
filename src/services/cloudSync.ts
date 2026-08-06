import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Note, Task } from '../types/task';

/**
 * Synchronisation personnelle entre appareils.
 *
 * Volontairement optionnelle : sans connexion, iDayal reste une application
 * strictement locale. C'est la promesse produit (« pas de compte ») ; la
 * synchro n'est qu'un confort pour un usage multi-appareils.
 *
 * La bibliothèque Supabase pèse à elle seule autant que toute l'application.
 * Elle est donc chargée **à la demande** : une installation sans
 * synchronisation ne la télécharge jamais.
 *
 * L'adresse du projet relève du déploiement, pas du code : elle n'est donc pas
 * écrite en dur dans un dépôt public.
 */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ?? '';

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

// iDayal a son propre schéma, distinct de « public » (commandes) et de
// « dashboard » (cockpit). Il doit figurer dans les schémas exposés du projet,
// sinon l'API REST le refuse.
const SCHEMA = 'idayal';
const TABLE = 'state';

let clientPromise: Promise<SupabaseClient> | null = null;

function getClient(): Promise<SupabaseClient> | null {
  if (!cloudEnabled) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    );
  }
  return clientPromise;
}

async function requireClient(): Promise<SupabaseClient> {
  const c = getClient();
  if (!c) throw new Error("La synchronisation n'est pas configurée.");
  return c;
}

export interface CloudState {
  tasks: Task[];
  notes: Note[];
}

export interface RemoteSnapshot {
  data: CloudState;
  updatedAt: string;
}

export async function getSession(): Promise<Session | null> {
  const c = getClient();
  if (!c) return null;
  const { data } = await (await c).auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void) {
  const c = getClient();
  if (!c) return () => {};
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  void c.then((client) => {
    if (cancelled) return;
    const { data } = client.auth.onAuthStateChange((_e, session) => cb(session));
    unsubscribe = () => data.subscription.unsubscribe();
  });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export async function signIn(email: string, password: string) {
  const client = await requireClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(traduireErreur(error.message));
}

export async function signUp(email: string, password: string) {
  const client = await requireClient();
  const { error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(traduireErreur(error.message));
}

export async function signOut() {
  const c = getClient();
  if (c) await (await c).auth.signOut();
}

/** Récupère l'état distant, ou null si le compte n'a encore rien envoyé. */
export async function pull(): Promise<RemoteSnapshot | null> {
  const client = await requireClient();
  const { data, error } = await client
    .schema(SCHEMA)
    .from(TABLE)
    .select('data, updated_at')
    .maybeSingle();
  if (error) throw new Error(traduireErreur(error.message));
  if (!data) return null;
  const raw = (data.data ?? {}) as Partial<CloudState>;
  return {
    data: {
      tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
      notes: Array.isArray(raw.notes) ? raw.notes : [],
    },
    updatedAt: data.updated_at as string,
  };
}

/** Écrit l'état complet. Renvoie l'horodatage retenu. */
export async function push(userId: string, state: CloudState): Promise<string> {
  const client = await requireClient();
  const updatedAt = new Date().toISOString();
  const { error } = await client
    .schema(SCHEMA)
    .from(TABLE)
    .upsert({ user_id: userId, data: state, updated_at: updatedAt }, { onConflict: 'user_id' });
  if (error) throw new Error(traduireErreur(error.message));
  return updatedAt;
}

function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Adresse ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return 'Adresse non confirmée — regarde tes mails.';
  if (m.includes('already registered')) return 'Ce compte existe déjà, connecte-toi.';
  if (m.includes('password') && m.includes('6')) return 'Mot de passe : 6 caractères minimum.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'Les inscriptions sont fermées sur ce projet.';
  if (m.includes('schema must be one of'))
    return "Le schéma « idayal » n'est pas exposé dans les réglages API du projet.";
  if (m.includes('failed to fetch')) return 'Pas de réseau.';
  return message;
}
