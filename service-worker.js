const CACHE_NAME = 'techcalc-v34-buffer-storage3';
const ASSETS = [
  './','./index.html','./manifest.json',
  './css/tokens.css','./css/layout.css','./css/components.css','./css/modules.css',
  './js/core/app.js','./js/core/registry.js','./js/core/router.js','./js/core/renderer.js','./js/core/preferences.js','./js/core/state.js','./js/core/navigation.js','./js/core/projectStorage.js','./js/core/pdfExport.js',
  './js/utils/calculations.js','./js/utils/units.js','./js/utils/pipes.js',
  './js/modules/heating-cooling/index.js','./js/modules/heating-cooling/config.js','./js/modules/heating-cooling/logic.js','./js/modules/heating-cooling/state.js',
  './js/modules/ventilation/index.js','./js/modules/ventilation/config.js','./js/modules/ventilation/logic.js','./js/modules/ventilation/state.js',
  './js/modules/pressure-holding/index.js','./js/modules/pressure-holding/config.js','./js/modules/pressure-holding/logic.js','./js/modules/pressure-holding/state.js',
  './js/modules/buffer-storage/index.js','./js/modules/buffer-storage/config.js','./js/modules/buffer-storage/logic.js','./js/modules/buffer-storage/state.js',
  './js/modules/heat-recovery/index.js','./js/modules/heat-recovery/config.js','./js/modules/heat-recovery/logic.js','./js/modules/heat-recovery/state.js',
  './js/modules/hx-diagram/index.js','./js/modules/hx-diagram/config.js','./js/modules/hx-diagram/logic.js','./js/modules/hx-diagram/state.js',
  './js/modules/pipe-sizing/index.js','./js/modules/pipe-sizing/config.js','./js/modules/pipe-sizing/logic.js','./js/modules/pipe-sizing/state.js',
  './js/modules/unit-converter/index.js','./js/modules/unit-converter/config.js','./js/modules/unit-converter/logic.js','./js/modules/unit-converter/state.js',
  './js/modules/drinking-water/index.js','./js/modules/drinking-water/config.js','./js/modules/drinking-water/logic.js','./js/modules/drinking-water/state.js',
  './assets/icons/icon-16.png','./assets/icons/icon-32.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon.ico'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'TECHCALC_CACHE_UPDATED', cache: CACHE_NAME }));
  })());
});

async function updateCache(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response?.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return null;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      event.waitUntil(updateCache(event.request));
      return cached;
    }

    const response = await updateCache(event.request);
    if (response) return response;
    return caches.match('./index.html');
  })());
});
