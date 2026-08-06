import { createClient, type Session } from '@supabase/supabase-js';
import type { Note, Task } from '../types/task';

/**
 * Synchronisation personnelle entre appareils.
 *
 * Volontairement optionnelle : sans connexion, iDayal reste une application
 * strictement locale. C'est la promesse produit (« pas de compte »), la
 * synchro n'est qu'un confort pour un usage multi-appareils.
 *
 * La clé publiable est faite pour être exposée côté navigateur : ce n'est pas
 * un secret. La protection repose sur la RLS, qui restreint chaque ligne à son
 * propriétaire.
 */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ?? '';

/**
 * Sans configuration, aucune synchronisation : l'application reste purement
 * locale. L'adresse du projet relève du déploiement, pas du code — elle n'est
 * donc pas écrite en dur dans un dépôt public.
 */
export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

const client = cloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

/** Lève si la synchro n'est pas configurée : les appelants testent `cloudEnabled`. */
function requireClient() {
  if (!client) throw new Error("La synchronisation n'est pas configurée.");
  return client;
}

export interface CloudState {
  tasks: Task[];
  notes: Note[];
}

export interface RemoteSnapshot {
  data: CloudState;
  updatedAt: string;
}

const TABLE = 'idayal_state';

export async function getSession(): Promise<Session | null> {
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void) {
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(traduireErreur(error.message));
}

export async function signUp(email: string, password: string) {
  const { error } = await requireClient().auth.signUp({ email, password });
  if (error) throw new Error(traduireErreur(error.message));
}

export async function signOut() {
  if (client) await client.auth.signOut();
}

/** Récupère l'état distant, ou null si le compte n'a encore rien envoyé. */
export async function pull(): Promise<RemoteSnapshot | null> {
  const { data, error } = await requireClient()
    .from(TABLE)
    .select('data, updated_at')
    .maybeSingle();
  if (error) throw new Error(error.message);
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

/** Écrit l'état complet. Renvoie l'horodatage retenu par le serveur. */
export async function push(userId: string, state: CloudState): Promise<string> {
  const updatedAt = new Date().toISOString();
  const { error } = await requireClient()
    .from(TABLE)
    .upsert(
      { user_id: userId, data: state, updated_at: updatedAt },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(error.message);
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
  return message;
}
