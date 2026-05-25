const CACHE_NAME = 'techcalc-pro-1.3.0';
const ASSETS = [
  './','./index.html','./manifest.json','./RELEASE_NOTES.md',
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
  './js/modules/wastewater/index.js','./js/modules/wastewater/config.js','./js/modules/wastewater/logic.js','./js/modules/wastewater/state.js','./js/modules/wastewater/tables.js',
  './js/modules/rainwater/index.js','./js/modules/rainwater/config.js','./js/modules/rainwater/logic.js','./js/modules/rainwater/state.js','./js/modules/rainwater/tables.js',
  './js/modules/flood-proof/index.js','./js/modules/flood-proof/config.js','./js/modules/flood-proof/logic.js','./js/modules/flood-proof/state.js',
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

async function fetchFresh(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response?.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return null;
  }
}

async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetchFresh(request);
    return cached;
  }
  const response = await fetchFresh(request);
  if (response) return response;
  return caches.match('./index.html');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isReleaseNotes = requestUrl.pathname.endsWith('/RELEASE_NOTES.md') || requestUrl.pathname.endsWith('RELEASE_NOTES.md');
  const isServiceWorker = requestUrl.pathname.endsWith('/service-worker.js') || requestUrl.pathname.endsWith('service-worker.js');

  if (isNavigation || isReleaseNotes || isServiceWorker) {
    event.respondWith((async () => {
      const fresh = await fetchFresh(event.request);
      if (fresh) return fresh;
      return caches.match(event.request) || caches.match('./index.html');
    })());
    return;
  }

  event.respondWith(cacheFirstWithRefresh(event.request));
});
