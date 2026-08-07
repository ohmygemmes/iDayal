/*
 * iDayal — service worker.
 *
 * Deux stratégies, et la distinction est essentielle :
 *
 * - Les *navigations* (index.html) passent par le réseau en priorité. Ce
 *   fichier désigne les bundles JS/CSS ; le servir depuis le cache fige
 *   l'application sur la version installée et rend toute mise à jour
 *   invisible. Le cache ne sert que de repli hors ligne.
 * - Les *ressources* (assets/index-<hash>.js, icônes…) passent par le cache
 *   en priorité : leur nom contient une empreinte, donc un contenu donné ne
 *   change jamais d'URL.
 */
const CACHE_NAME = 'idayal-cache-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function putInCache(req, res) {
  if (!res || res.status !== 200 || res.type === 'opaque') return;
  const copy = res.clone();
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(req, copy))
    .catch(() => {});
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation : réseau d'abord, cache en repli hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          putInCache(req, res);
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Ressources : cache d'abord, réseau sinon.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          putInCache(req, res);
          return res;
        })
        .catch(() => cached);
    })
  );
});
