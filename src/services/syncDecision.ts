export type SyncDecision = 'adopt' | 'push' | 'noop';

export interface SyncInputs {
  /** État local sérialisé. */
  localJson: string;
  /** Vrai si l'appareil n'a ni tâche ni note. */
  localIsEmpty: boolean;
  /** État distant, ou null si le compte n'a encore jamais rien envoyé. */
  remote: { json: string; updatedAt: string } | null;
  /** Horodatage de la dernière modification faite sur cet appareil (0 si aucune). */
  lastLocalEditAt: number;
}

/**
 * Arbitre entre l'état local et l'état distant.
 *
 * La règle qui compte, et qui manquait : **un appareil vierge n'écrase jamais
 * des données existantes**. Se connecter depuis un nouveau navigateur doit
 * télécharger, jamais publier le vide.
 *
 * Le reste est du dernier-écrivain-gagne, suffisant pour une personne sur deux
 * appareils qui modifie rarement les deux en même temps.
 */
export function decideSync({
  localJson,
  localIsEmpty,
  remote,
  lastLocalEditAt,
}: SyncInputs): SyncDecision {
  // Rien côté serveur : on publie, sauf s'il n'y a rien à publier.
  if (!remote) return localIsEmpty ? 'noop' : 'push';

  // Déjà identiques.
  if (remote.json === localJson) return 'noop';

  // Garde-fou : le vide ne remplace pas ce qui existe.
  if (localIsEmpty) return 'adopt';

  return new Date(remote.updatedAt).getTime() > lastLocalEditAt ? 'adopt' : 'push';
}
