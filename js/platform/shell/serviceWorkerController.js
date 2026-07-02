import { markPerformance, startPerformanceSpan } from './performanceController.js';

let serviceWorkerControllerInitialized = false;
let reloadOnControllerChange = false;
let activeWaitingWorker = null;

export const DEFAULT_CACHE_UPDATED_TYPE = 'TECHCALC_CACHE_UPDATED';

function defaultRegisterUrl(appVersion = '') {
  const version = String(appVersion || '').trim();
  const suffix = version ? `?v=${encodeURIComponent(version)}` : '';
  return `./service-worker.js${suffix}`;
}

function ensureUpdateBanner(windowRef, documentRef, waitingWorker) {
  if (!documentRef?.body || !waitingWorker) return;
  activeWaitingWorker = waitingWorker;

  let banner = documentRef.getElementById('techcalcUpdateBanner');
  if (!banner) {
    banner = documentRef.createElement('div');
    banner.id = 'techcalcUpdateBanner';
    banner.className = 'tc-update-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.innerHTML = `
      <span>Neue Version verfügbar. Bitte aktualisieren, um die aktuelle App-Version zu verwenden.</span>
      <button type="button" class="tc-update-banner__button">Aktualisieren</button>
    `;
    documentRef.body.appendChild(banner);
  }

  const updateButton = banner.querySelector('.tc-update-banner__button');
  if (updateButton) {
    updateButton.disabled = false;
    updateButton.textContent = 'Aktualisieren';
    updateButton.onclick = () => {
      reloadOnControllerChange = true;
      try {
        activeWaitingWorker?.postMessage({ type: 'SKIP_WAITING' });
        updateButton.disabled = true;
        updateButton.textContent = 'Aktualisiere …';
      } catch (error) {
        console.warn('Service worker update could not be activated:', error);
        windowRef.location.reload();
      }
    };
  }

  banner.hidden = false;
}

function hasControlledPage(windowRef) {
  return Boolean(windowRef.navigator?.serviceWorker?.controller);
}

function watchRegistration(registration, windowRef, documentRef) {
  if (!registration) return;

  if (registration.waiting && hasControlledPage(windowRef)) {
    ensureUpdateBanner(windowRef, documentRef, registration.waiting);
  }

  registration.addEventListener?.('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener?.('statechange', () => {
      if (newWorker.state === 'installed' && hasControlledPage(windowRef)) {
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
      .then(async registration => {
        finishRegistration({ status: 'ok' });
        watchRegistration(registration, windowRef, documentRef);
        await registration?.update?.();
        if (registration?.waiting && hasControlledPage(windowRef)) {
          ensureUpdateBanner(windowRef, documentRef, registration.waiting);
        }
        return registration;
      })
      .catch(error => {
        finishRegistration({ status: 'error', error: error?.message || String(error) });
        console.warn('Service worker registration failed:', error);
      });
  });

  return true;
}

export default initializeServiceWorkerController;
