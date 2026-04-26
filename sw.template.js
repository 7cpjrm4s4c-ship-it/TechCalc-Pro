/* ═══════════════════════════════════════════════════════
   sw.js  —  TechCalc Pro Service Worker
   Strategie: Cache-First + Stale-While-Revalidate
   Cache-Version: AUTO-GENERATED via build timestamp
   → Kein manuelles Hochzählen mehr nötig
═══════════════════════════════════════════════════════ */
'use strict';

/* Auto-version: wird bei jedem Deployment neu generiert */
const BUILD_TS   = '20260426-1118';          // Platzhalter für deploy-script
const CACHE_NAME = `techcalc-${BUILD_TS}`;  // z.B. techcalc-20250426-1430

const PRECACHE = [
  './',
  './index.html',
  './app.js',
  './heating-cooling.js',
  './ventilation.js',
  './wrg-mischluft.js',
  './pdf-export.js',
  './hx-engine.js',
  './styles.css',
  './manifest.json',
  './favicon.ico',
  /* Icons — nur produktionsrelevante Größen */
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',   /* iOS Apple Touch */
  './icon-167.png',   /* iOS iPad Pro */
  './icon-152.png',   /* iOS iPad */
];

const BYPASS = [
  'workers.dev',
  'analytics',
  'cloudflare',
];

/* ─── INSTALL ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

/* ─── ACTIVATE — alten Cache löschen ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ─── FETCH — Cache-First mit Background-Update ─── */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (BYPASS.some(b => url.hostname.includes(b))) return;
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchP = fetch(request)
    .then(r => {
      if (r && r.status === 200 && r.type !== 'opaque') {
        cache.put(request, r.clone());
      }
      return r;
    })
    .catch(() => null);

  if (cached) return cached;
  const net = await fetchP;
  if (net)   return net;
  if (request.mode === 'navigate') return cache.match('./index.html');
  return new Response('', { status: 408 });
}

/* ─── MESSAGE ─── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
