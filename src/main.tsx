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
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
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
