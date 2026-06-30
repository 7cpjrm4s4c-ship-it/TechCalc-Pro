import { markPerformance, startPerformanceSpan } from './performanceController.js';

let serviceWorkerControllerInitialized = false;
let reloadOnControllerChange = false;

export const DEFAULT_CACHE_UPDATED_TYPE = 'TECHCALC_CACHE_UPDATED';

function defaultRegisterUrl(appVersion = '') {
  const version = String(appVersion || '').trim();
  const suffix = version ? `?v=${encodeURIComponent(version)}` : '';
  return `./service-worker.js${suffix}`;
}

function ensureUpdateBanner(windowRef, documentRef, waitingWorker) {
  if (!documentRef?.body || !waitingWorker) return;

  let banner = documentRef.getElementById('techcalcUpdateBanner');
  if (!banner) {
    banner = documentRef.createElement('div');
    banner.id = 'techcalcUpdateBanner';
    banner.className = 'tc-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <span>Neue Version verfügbar.</span>
      <button type="button" class="tc-update-banner__button">Aktualisieren</button>
      <button type="button" class="tc-update-banner__dismiss" aria-label="Update-Hinweis schließen">×</button>
    `;
    documentRef.body.appendChild(banner);
  }

  const updateButton = banner.querySelector('.tc-update-banner__button');
  const dismissButton = banner.querySelector('.tc-update-banner__dismiss');

  updateButton?.addEventListener('click', () => {
    reloadOnControllerChange = true;
    try {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      updateButton.disabled = true;
      updateButton.textContent = 'Aktualisiere …';
    } catch (error) {
      console.warn('Service worker update could not be activated:', error);
      windowRef.location.reload();
    }
  }, { once: true });

  dismissButton?.addEventListener('click', () => {
    banner.remove();
  }, { once: true });

  banner.hidden = false;
}

function watchRegistration(registration, windowRef, documentRef) {
  if (!registration) return;

  if (registration.waiting && windowRef.navigator?.serviceWorker?.controller) {
    ensureUpdateBanner(windowRef, documentRef, registration.waiting);
  }

  registration.addEventListener?.('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener?.('statechange', () => {
      if (newWorker.state === 'installed' && windowRef.navigator?.serviceWorker?.controller) {
        markPerformance('service-worker:update-available');
        ensureUpdateBanner(windowRef, documentRef, newWorker);
      }
    });
  });
}

export function initializeServiceWorkerController(options = {}) {
  if (serviceWorkerControllerInitialized) return false;

  const navigatorRef = options.navigatorRef || (typeof navigator !== 'undefined' ? navigator : null);
  const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
  const documentRef = options.documentRef || (typeof document !== 'undefined' ? document : null);
  const sessionStorageRef = options.sessionStorageRef || (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  const registerUrl = options.registerUrl || defaultRegisterUrl(options.appVersion);
  const cacheUpdatedType = options.cacheUpdatedType || DEFAULT_CACHE_UPDATED_TYPE;

  if (!navigatorRef?.serviceWorker || !windowRef) return false;

  serviceWorkerControllerInitialized = true;

  navigatorRef.serviceWorker.addEventListener?.('controllerchange', () => {
    markPerformance('service-worker:controllerchange', { reload: reloadOnControllerChange });
    if (reloadOnControllerChange) windowRef.location.reload();
  });

  navigatorRef.serviceWorker.addEventListener?.('message', event => {
    if (event?.data?.type !== cacheUpdatedType) return;
    const cacheName = event.data.cache || 'updated';
    sessionStorageRef?.setItem?.('techcalc-active-cache', cacheName);
    markPerformance('service-worker:cache-updated', { cacheName });
  });

  windowRef.addEventListener?.('load', () => {
    const finishRegistration = startPerformanceSpan('service-worker:register', { registerUrl });
    navigatorRef.serviceWorker
      .register(registerUrl)
      .then(registration => {
        finishRegistration({ status: 'ok' });
        watchRegistration(registration, windowRef, documentRef);
        return registration?.update?.();
      })
      .catch(error => {
        finishRegistration({ status: 'error', error: error?.message || String(error) });
        console.warn('Service worker registration failed:', error);
      });
  });

  return true;
}

export default initializeServiceWorkerController;
