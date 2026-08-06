import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enregistrement du service worker (uniquement en prod, pour ne pas perturber le HMR).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
