/* ═══════════════════════════════════════════════════════
   sw.js  —  Massenstromrechner PWA Service Worker
   Strategie: Cache-First + Network-Update
   Cache-Version hochzählen bei jedem Deployment!
═══════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME = 'massenstrom-v2.2';

/* Alle App-Ressourcen die offline verfügbar sein müssen */
const PRECACHE = [
  './',
  './index.html',
  '/hx-engine.js',
  '/heating-cooling.js',
  '/ventilation.js',
  '/pdf-export.js',
  '/wrg-mischluft.js',
  '/favicon.ico',
  '/icon-16.png',
  '/icon-32.png',
  '/icon-48.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-120.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-167.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-512.png',
  '/icon-1024.png',
  '/app.js',
  '/styles.css',
  '/manifest.json',
];

/* Analytics-Worker und externe URLs NICHT cachen */
const BYPASS = [
  'massenstromrechner.h29jvxt9m8.workers.dev',
  'analytics',
];

/* ─── INSTALL — Alle Dateien precachen ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())  // sofort aktiv werden
  );
});

/* ─── ACTIVATE — Alten Cache löschen ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // sofort alle Tabs übernehmen
  );
});

/* ─── FETCH — Cache-First mit Background-Update ─── */
self.addEventListener('fetch', event => {
  const { request } = event;

  // Nur GET-Requests cachen
  if (request.method !== 'GET') return;

  // Analytics & externe Requests durchleiten
  const url = new URL(request.url);
  if (BYPASS.some(b => url.hostname.includes(b))) return;

  // Nur same-origin + http(s) cachen
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin &&
      !PRECACHE.includes(url.pathname)) return;

  event.respondWith(cacheFirst(request));
});

/* Cache-First: aus Cache liefern, im Hintergrund aktualisieren */
async function cacheFirst(request) {
  const cache    = await caches.open(CACHE_NAME);
  const cached   = await cache.match(request);

  // Hintergrund-Update anstoßen (Stale-While-Revalidate)
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);  // Offline: Fehler still ignorieren

  // Cache-Treffer → sofort liefern, Update läuft im Hintergrund
  if (cached) return cached;

  // Kein Cache → auf Netzwerk warten
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Offline + kein Cache → Fallback nur für Navigation (nicht für JS/CSS/API)
  if (request.mode === 'navigate') return cache.match('/index.html');
  return new Response('', { status: 408 }); // Timeout für Assets
}

/* ─── MESSAGE — Sofortiger Update-Trigger aus index.html ─── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
