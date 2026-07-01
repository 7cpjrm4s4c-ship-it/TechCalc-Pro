const CACHE_NAME = 'techcalc-pro-1.3.1-rc.7';
const CACHE_REVISION = '1.3.1-rc.7-techcalc-pro-1-3-1-rc-6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './RELEASE_NOTES.md',
  './css/components.css',
  './css/layout.css',
  './css/modules.css',
  './css/tokens.css',
  './js/core/app.js',
  './js/core/centralStore.js',
  './js/core/domUpdate.js',
  './js/core/eventDelegation.js',
  './js/core/eventManager.js',
  './js/core/eventPipeline.js',
  './js/core/focusManager.js',
  './js/core/formActions.js',
  './js/core/formSchema.js',
  './js/core/moduleContract.js',
  './js/core/moduleDefinition.js',
  './js/core/moduleLifecycleAdapter.js',
  './js/core/moduleRuntime.js',
  './js/core/mount.js',
  './js/core/navigation.js',
  './js/core/numberService.js',
  './js/core/numbers.js',
  './js/core/pdf/pdfChartRender.js',
  './js/core/pdf/pdfDataMapping.js',
  './js/core/pdf/pdfLayout.js',
  './js/core/pdf/pdfText.js',
  './js/core/pdf/reportTheme.js',
  './js/core/pdfExport.js',
  './js/core/platformLifecycle.js',
  './js/core/platformPolicy.js',
  './js/core/preferences.js',
  './js/core/projectStorage.js',
  './js/core/quality/appHealth.js',
  './js/core/quality/performanceBudget.js',
  './js/core/registry.js',
  './js/core/renderCoordinator.js',
  './js/core/renderScheduler.js',
  './js/core/renderer.js',
  './js/core/resultRenderer.js',
  './js/core/router.js',
  './js/core/savedCalculationController.js',
  './js/core/savedRecordController.js',
  './js/core/savedRecords.js',
  './js/core/schemaModuleMount.js',
  './js/core/schemaRenderer.js',
  './js/core/scrollManager.js',
  './js/core/state.js',
  './js/core/stateBinding.js',
  './js/core/uiSystem.js',
  './js/modules/buffer-storage/config.js',
  './js/modules/buffer-storage/controller.js',
  './js/modules/buffer-storage/index.js',
  './js/modules/buffer-storage/logic.js',
  './js/modules/buffer-storage/results.js',
  './js/modules/buffer-storage/schema.js',
  './js/modules/buffer-storage/state.js',
  './js/modules/buffer-storage/view.js',
  './js/modules/buffer-storage/viewModel.js',
  './js/modules/drinking-water/config.js',
  './js/modules/drinking-water/controller.js',
  './js/modules/drinking-water/dynamicRenderer.js',
  './js/modules/drinking-water/index.js',
  './js/modules/drinking-water/logic.js',
  './js/modules/drinking-water/results.js',
  './js/modules/drinking-water/schema.js',
  './js/modules/drinking-water/state.js',
  './js/modules/drinking-water/view.js',
  './js/modules/drinking-water/viewModel.js',
  './js/modules/heat-recovery/config.js',
  './js/modules/heat-recovery/controller.js',
  './js/modules/heat-recovery/dynamicRenderer.js',
  './js/modules/heat-recovery/index.js',
  './js/modules/heat-recovery/logic.js',
  './js/modules/heat-recovery/results.js',
  './js/modules/heat-recovery/schema.js',
  './js/modules/heat-recovery/state.js',
  './js/modules/heat-recovery/view.js',
  './js/modules/heat-recovery/viewModel.js',
  './js/modules/heating-cooling/config.js',
  './js/modules/heating-cooling/controller.js',
  './js/modules/heating-cooling/index.js',
  './js/modules/heating-cooling/logic.js',
  './js/modules/heating-cooling/results.js',
  './js/modules/heating-cooling/schema.js',
  './js/modules/heating-cooling/state.js',
  './js/modules/heating-cooling/view.js',
  './js/modules/heating-cooling/viewModel.js',
  './js/modules/hx-diagram/config.js',
  './js/modules/hx-diagram/controller.js',
  './js/modules/hx-diagram/diagramRenderer.js',
  './js/modules/hx-diagram/dynamicRenderer.js',
  './js/modules/hx-diagram/formRenderer.js',
  './js/modules/hx-diagram/index.js',
  './js/modules/hx-diagram/logic.js',
  './js/modules/hx-diagram/renderPipeline.js',
  './js/modules/hx-diagram/results.js',
  './js/modules/hx-diagram/schema.js',
  './js/modules/hx-diagram/state.js',
  './js/modules/hx-diagram/view.js',
  './js/modules/hx-diagram/viewModel.js',
  './js/modules/pipe-sizing/config.js',
  './js/modules/pipe-sizing/controller.js',
  './js/modules/pipe-sizing/index.js',
  './js/modules/pipe-sizing/logic.js',
  './js/modules/pipe-sizing/results.js',
  './js/modules/pipe-sizing/schema.js',
  './js/modules/pipe-sizing/state.js',
  './js/modules/pipe-sizing/view.js',
  './js/modules/pipe-sizing/viewModel.js',
  './js/modules/pressure-holding/config.js',
  './js/modules/pressure-holding/controller.js',
  './js/modules/pressure-holding/index.js',
  './js/modules/pressure-holding/logic.js',
  './js/modules/pressure-holding/results.js',
  './js/modules/pressure-holding/schema.js',
  './js/modules/pressure-holding/state.js',
  './js/modules/pressure-holding/view.js',
  './js/modules/pressure-holding/viewModel.js',
  './js/modules/rainwater/config.js',
  './js/modules/rainwater/controller.js',
  './js/modules/rainwater/index.js',
  './js/modules/rainwater/logic.js',
  './js/modules/rainwater/results.js',
  './js/modules/rainwater/schema.js',
  './js/modules/rainwater/state.js',
  './js/modules/rainwater/tables.js',
  './js/modules/rainwater/view.js',
  './js/modules/rainwater/viewModel.js',
  './js/modules/unit-converter/config.js',
  './js/modules/unit-converter/controller.js',
  './js/modules/unit-converter/index.js',
  './js/modules/unit-converter/logic.js',
  './js/modules/unit-converter/results.js',
  './js/modules/unit-converter/schema.js',
  './js/modules/unit-converter/state.js',
  './js/modules/unit-converter/view.js',
  './js/modules/unit-converter/viewModel.js',
  './js/modules/ventilation/config.js',
  './js/modules/ventilation/controller.js',
  './js/modules/ventilation/index.js',
  './js/modules/ventilation/logic.js',
  './js/modules/ventilation/results.js',
  './js/modules/ventilation/schema.js',
  './js/modules/ventilation/state.js',
  './js/modules/ventilation/view.js',
  './js/modules/ventilation/viewModel.js',
  './js/modules/wastewater/config.js',
  './js/modules/wastewater/controller.js',
  './js/modules/wastewater/index.js',
  './js/modules/wastewater/lineModel.js',
  './js/modules/wastewater/logic.js',
  './js/modules/wastewater/results.js',
  './js/modules/wastewater/schema.js',
  './js/modules/wastewater/state.js',
  './js/modules/wastewater/tables.js',
  './js/modules/wastewater/view.js',
  './js/modules/wastewater/viewModel.js',
  './js/platform/collectionModel/index.js',
  './js/platform/collectionRenderer/index.js',
  './js/platform/debugPanel/index.js',
  './js/platform/dynamicRenderer/index.js',
  './js/platform/lineSectionController/index.js',
  './js/platform/moduleRenderer/index.js',
  './js/platform/moduleRuntime/index.js',
  './js/platform/resultRenderer/index.js',
  './js/platform/savedRecordModel/index.js',
  './js/platform/shell/feedbackController.js',
  './js/platform/shell/performanceController.js',
  './js/platform/shell/releaseNotesController.js',
  './js/platform/shell/serviceWorkerController.js',
  './js/platform/shell/settingsController.js',
  './js/platform/shell/themeController.js',
  './js/utils/calculations.js',
  './js/utils/pipes.js',
  './js/utils/units.js',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.ico',
  './assets/icons/icon-16.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-32.png',
  './assets/icons/icon-512.png',
  './docs/legal/agb.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'TECHCALC_CACHE_UPDATED', cache: CACHE_NAME, revision: CACHE_REVISION }));
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

function isVersionCriticalAsset(requestUrl) {
  return requestUrl.pathname.endsWith('/index.html')
    || requestUrl.pathname.endsWith('/js/core/app.js')
    || requestUrl.pathname.endsWith('/js/platform/shell/releaseNotesController.js')
    || requestUrl.pathname.endsWith('/service-worker.js')
    || requestUrl.pathname.endsWith('/RELEASE_NOTES.md')
    || requestUrl.pathname.endsWith('/manifest.json');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isReleaseNotes = requestUrl.pathname.endsWith('/RELEASE_NOTES.md') || requestUrl.pathname.endsWith('RELEASE_NOTES.md');
  const isServiceWorker = requestUrl.pathname.endsWith('/service-worker.js') || requestUrl.pathname.endsWith('service-worker.js');
  const isVersionCritical = isVersionCriticalAsset(requestUrl);

  if (isNavigation || isReleaseNotes || isServiceWorker || isVersionCritical) {
    event.respondWith((async () => {
      const fresh = await fetchFresh(event.request);
      if (fresh) return fresh;
      return caches.match(event.request) || caches.match('./index.html');
    })());
    return;
  }

  event.respondWith(cacheFirstWithRefresh(event.request));
});
