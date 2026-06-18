let serviceWorkerControllerInitialized = false;

export const DEFAULT_CACHE_UPDATED_TYPE = 'TECHCALC_CACHE_UPDATED';

function defaultRegisterUrl(appVersion = '') {
  const version = String(appVersion || '').trim();
  const suffix = version ? `?v=${encodeURIComponent(version)}` : '';
  return `./service-worker.js${suffix}`;
}

export function initializeServiceWorkerController(options = {}) {
  if (serviceWorkerControllerInitialized) return false;

  const navigatorRef = options.navigatorRef || (typeof navigator !== 'undefined' ? navigator : null);
  const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
  const sessionStorageRef = options.sessionStorageRef || (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  const registerUrl = options.registerUrl || defaultRegisterUrl(options.appVersion);
  const cacheUpdatedType = options.cacheUpdatedType || DEFAULT_CACHE_UPDATED_TYPE;

  if (!navigatorRef?.serviceWorker || !windowRef) return false;

  serviceWorkerControllerInitialized = true;

  navigatorRef.serviceWorker.addEventListener?.('message', event => {
    if (event?.data?.type !== cacheUpdatedType) return;
    const cacheName = event.data.cache || 'updated';
    sessionStorageRef?.setItem?.('techcalc-active-cache', cacheName);
    // Kein automatischer Reload: Beim Zurueckwechseln aus dem PDF-Export duerfen
    // aktuelle Berechnungsergebnisse in der Session nicht verloren gehen.
  });

  windowRef.addEventListener?.('load', () => {
    navigatorRef.serviceWorker
      .register(registerUrl)
      .then(registration => registration?.update?.())
      .catch(error => console.warn('Service worker registration failed:', error));
  });

  return true;
}

export default initializeServiceWorkerController;
