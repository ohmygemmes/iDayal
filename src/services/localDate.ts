/**
 * Dates en heure locale.
 *
 * `toISOString()` travaille en UTC et décale d'un jour dès qu'on est à l'est de
 * Greenwich : une tâche pour « demain 00:00 » y devient celle d'aujourd'hui.
 * Tout ce qui touche à une date passe donc par ici.
 *
 * Ces fonctions vivaient dans le store, que les composants importaient juste
 * pour formater une date. Elles n'ont rien à voir avec l'état de l'application.
 */

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD en heure LOCALE (pas UTC). */
export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** YYYY-MM-DDTHH:mm en heure LOCALE. */
export function toLocalISODateTime(d: Date): string {
  return `${toLocalISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
