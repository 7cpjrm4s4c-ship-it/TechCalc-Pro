/* ═══════════════════════════════════════════════════════
   sw.js — TechCalc Pro Service Worker
   Deployment: bash deploy.sh ersetzt BUILD_TS automatisch
═══════════════════════════════════════════════════════ */
'use strict';

const BUILD_TS   = '20260428-Phase5UiPolishLueftung';
const CACHE_NAME = `techcalc-${BUILD_TS}`;

const PRECACHE = [
  './', './index.html',
  './tokens.css', './layout.css', './components.css',
  './app.js', './heating-cooling.js', './ventilation.js',
  './wrg-mischluft.js', './trinkwasser.js', './pdf-export.js', './hx-engine.js',
  './manifest.json', './favicon.ico',
  './icon-192.png', './icon-512.png', './icon-180.png',
  './icon-167.png', './icon-152.png'
];

const BYPASS = ['workers.dev', 'analytics', 'cloudflare'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some(b => url.hostname.includes(b))) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const network = fetch(request).then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);

    if (cached) {
      network.catch(() => null);
      return cached;
    }

    const fresh = await network;
    if (fresh) return fresh;
    if (request.mode === 'navigate') return cache.match('./index.html');
    return new Response('', { status: 408, statusText: 'Offline cache miss' });
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
