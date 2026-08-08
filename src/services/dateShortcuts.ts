import { pad2, toLocalISODate, toLocalISODateTime } from './localDate';

/**
 * Règles des raccourcis de date de la barre de saisie.
 *
 * Isolées ici pour être couvertes par des tests : elles portent une promesse
 * précise, facile à casser sans s'en apercevoir, et invisible à la relecture.
 *
 * Une valeur retenue est soit vide, soit `YYYY-MM-DD`, soit `YYYY-MM-DDTHH:mm`.
 */
export type Scheduled = string;

/** Heure de repli pour un jour choisi sans heure, quand ce n'est pas aujourd'hui. */
const FALLBACK_HOUR = 9;

/**
 * Point de départ d'un décalage.
 *
 * La règle qui compte : « 12h » puis « +1h » doit donner 13h, pas l'heure
 * qu'il est plus une. On part donc de ce qui est déjà retenu.
 *
 * Un jour retenu sans heure n'a pas de point de départ évident. Pour
 * aujourd'hui, l'heure courante est la réponse naturelle. Pour un autre jour,
 * elle ne l'est pas : à 23h30, décaler d'une heure ferait basculer au
 * lendemain le jour que l'utilisateur venait de choisir.
 */
export function shiftBase(scheduled: Scheduled, now: Date): Date {
  if (scheduled.length > 10) return new Date(scheduled);
  if (!scheduled) return new Date(now.getTime());

  const d = new Date(scheduled + 'T00:00:00');
  if (scheduled === toLocalISODate(now)) d.setHours(now.getHours(), now.getMinutes(), 0, 0);
  else d.setHours(FALLBACK_HOUR, 0, 0, 0);
  return d;
}

/**
 * Décale de `hours` heures à partir de ce qui est retenu.
 *
 * `setHours` et non une addition de millisecondes : l'arithmétique d'époque
 * ignore le changement d'heure, et « 24 » rendrait 11h ou 13h le lendemain du
 * basculement au lieu de la même heure.
 */
export function shiftBy(scheduled: Scheduled, hours: number, now: Date): string {
  const d = shiftBase(scheduled, now);
  d.setHours(d.getHours() + hours);
  return toLocalISODateTime(d);
}

/**
 * Pose une heure fixe sur le jour retenu.
 *
 * Sans jour retenu, l'heure vaut pour aujourd'hui — sauf si elle est déjà
 * passée, auquel cause elle désigne demain : toucher « 09:00 » à 22h40 ne veut
 * pas dire ce matin, et poser la tâche là la fait naître en retard.
 *
 * Un jour explicitement choisi, lui, commande : « Demain » puis « 09:00 » reste
 * demain matin, et rien ne bascule.
 */
export function atTimeOfDay(scheduled: Scheduled, h: number, m: number, now: Date): string {
  if (scheduled) return `${scheduled.slice(0, 10)}T${pad2(h)}:${pad2(m)}`;

  const d = new Date(now.getTime());
  d.setHours(h, m, 0, 0);
  if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
  return toLocalISODateTime(d);
}
