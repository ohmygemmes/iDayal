import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isNativeShell } from './services/platform';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/*
 * Enregistrement du service worker.
 *
 * Uniquement en production, pour ne pas perturber le rechargement à chaud —
 * et jamais dans la coque native.
 *
 * Dans l'application iOS les fichiers sont déjà sur l'appareil : le service
 * worker n'apporterait aucun hors-ligne qui n'existe pas déjà. Il ajouterait
 * en revanche un cache par-dessus des fichiers locaux, et c'est un vrai
 * risque : après une mise à jour par l'App Store, le contenu du paquet est
 * remplacé mais le cache, lui, survit. L'application se relancerait sur
 * l'ancienne version, sans réseau pour l'en sortir.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD && !isNativeShell()) {
  /*
   * Recharger quand une nouvelle version prend la main permet de ne pas rester
   * bloqué sur du code périmé.
   *
   * Mais à la toute première visite il n'y a aucun contrôleur : le service
   * worker s'installe, revendique la page, et « controllerchange » se déclenche
   * alors qu'il n'y a rien à mettre à jour. Recharger là détruit ce que la page
   * était en train de faire — typiquement une tâche capturée via ?add= par le
   * raccourci Siri, perdue avant d'avoir été enregistrée.
   *
   * On ne recharge donc que s'il y avait déjà un contrôleur, c'est-à-dire en
   * cas de vraie mise à jour.
   */
  /*
   * Un rechargement par onglet, pas un de plus.
   *
   * Le garde-fou était une variable de module — donc effacée par le
   * rechargement même qu'elle devait empêcher. Il ne pouvait rien garder.
   *
   * Et la boucle est facile à amorcer : le service worker appelle
   * `skipWaiting()` puis `clients.claim()`, ce qui déclenche
   * « controllerchange », donc un rechargement, donc une nouvelle page qui
   * réenregistre et redemande une mise à jour. Il suffit que le fichier servi
   * varie d'une requête à l'autre — plusieurs mises en ligne rapprochées
   * derrière un réseau de diffusion suffisent — pour que ça ne s'arrête jamais.
   *
   * `sessionStorage` survit au rechargement et meurt avec l'onglet : c'est
   * exactement la portée qu'il faut. En cas de stockage refusé, on ne recharge
   * pas du tout — une version périmée vaut mieux qu'une page qui clignote.
   */
  const RELOADED_KEY = 'idayal:sw-reloaded';
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    try {
      if (sessionStorage.getItem(RELOADED_KEY)) return;
      sessionStorage.setItem(RELOADED_KEY, '1');
    } catch {
      return;
    }
    window.location.reload();
  });

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // Cherche une mise à jour à chaque ouverture, puis toutes les heures
        // si l'application reste ouverte longtemps.
        reg.update().catch(() => {});
        window.setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(() => {
        // silent
      });
  });
}
