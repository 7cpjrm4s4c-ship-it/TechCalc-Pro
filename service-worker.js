const CACHE_NAME = 'techcalc-pro-wrg-desktop-split-v4';
const ASSETS = [
  './','./index.html','./manifest.json',
  './css/tokens.css','./css/layout.css','./css/components.css','./css/modules.css',
  './js/core/app.js','./js/core/registry.js','./js/core/router.js','./js/core/renderer.js','./js/core/preferences.js','./js/core/state.js','./js/core/navigation.js',
  './js/utils/calculations.js','./js/utils/units.js','./js/utils/pipes.js',
  './js/modules/heating-cooling/index.js','./js/modules/heating-cooling/config.js','./js/modules/heating-cooling/logic.js','./js/modules/heating-cooling/state.js',
  './js/modules/ventilation/index.js','./js/modules/ventilation/config.js','./js/modules/ventilation/logic.js','./js/modules/ventilation/state.js',
  './js/modules/heat-recovery/index.js','./js/modules/heat-recovery/config.js','./js/modules/heat-recovery/logic.js','./js/modules/heat-recovery/state.js',
  './js/modules/pipe-sizing/index.js','./js/modules/pipe-sizing/config.js','./js/modules/pipe-sizing/logic.js','./js/modules/pipe-sizing/state.js',
  './js/modules/unit-converter/index.js','./js/modules/unit-converter/config.js','./js/modules/unit-converter/logic.js','./js/modules/unit-converter/state.js',
  './assets/icons/icon-16.png','./assets/icons/icon-32.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon.ico'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
