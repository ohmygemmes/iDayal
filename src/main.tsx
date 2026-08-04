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
  // Quand une nouvelle version prend le contrôle, on recharge une fois pour
  // que la page utilise le nouveau code au lieu de rester sur l'ancien.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
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
