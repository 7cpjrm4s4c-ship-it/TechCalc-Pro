import { hardResetModuleRoot } from './moduleLifecycleAdapter.js';
import { preserveModuleSwitchScroll } from './scrollManager.js';
import { restoreFocus as restorePlatformFocus } from './focusManager.js';

const DEFAULT_MOUNT_TIMEOUT_MS = 7000;
const DEFAULT_LOADING_DELAY_MS = 120;

function now() {
  return Date.now();
}

function noop() {}

function normalizeHookResult(cleanup, cleanups) {
  if (!cleanup) return;
  if (Array.isArray(cleanup)) {
    cleanup.forEach(item => normalizeHookResult(item, cleanups));
    return;
  }
  if (
    typeof cleanup === 'function' ||
    typeof cleanup?.dispose === 'function' ||
    typeof cleanup?.destroy === 'function' ||
    typeof cleanup?.unmount === 'function'
  ) {
    cleanups.push(cleanup);
  }
}

function runCleanup(cleanup) {
  try {
    if (typeof cleanup === 'function') cleanup();
    else if (typeof cleanup?.dispose === 'function') cleanup.dispose();
    else if (typeof cleanup?.destroy === 'function') cleanup.destroy();
    else if (typeof cleanup?.unmount === 'function') cleanup.unmount();
  } catch (error) {
    console.warn('Modul-Cleanup konnte nicht vollständig ausgeführt werden.', error);
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = 0;
  const timeout = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout])
    .finally(() => {
      if (timeoutId) globalThis.clearTimeout(timeoutId);
    });
}

export function createModuleRuntime({ root, modules, renderNavigation, loadingView, loadingDelayMs = DEFAULT_LOADING_DELAY_MS } = {}) {
  if (!root) throw new Error('ModuleRuntime benötigt einen App-Root.');
  if (!modules?.get) throw new Error('ModuleRuntime benötigt eine Modul-Registry.');

  let renderToken = 0;
  let activeCleanup = noop;
  let activeModuleId = '';
  let activeRuntimeCleanups = [];
  let loadingTimer = 0;

  function isCurrent(token) {
    return token === renderToken && root.dataset?.renderToken === String(token);
  }

  function clearRuntimeCleanups() {
    for (let index = activeRuntimeCleanups.length - 1; index >= 0; index -= 1) {
      runCleanup(activeRuntimeCleanups[index]);
    }
    activeRuntimeCleanups = [];
  }

  function clearLoadingTimer() {
    if (loadingTimer) {
      globalThis.clearTimeout(loadingTimer);
      loadingTimer = 0;
    }
  }

  function resetRoot() {
    clearLoadingTimer();
    hardResetModuleRoot(root);
    root.__tcLastHtml = '';
  }

  async function beforeUnmount(nextModuleId) {
    root.dispatchEvent(new CustomEvent('techcalc:module-before-unmount', {
      bubbles: false,
      detail: { from: activeModuleId, to: nextModuleId }
    }));
  }

  async function unmount(nextModuleId) {
    await beforeUnmount(nextModuleId);
    try { activeCleanup?.(); } catch (error) {
      console.warn('Aktives Modul konnte nicht vollständig verlassen werden.', error);
    }
    activeCleanup = noop;
    clearRuntimeCleanups();
    resetRoot();
    root.dispatchEvent(new CustomEvent('techcalc:module-unmounted', {
      bubbles: false,
      detail: { from: activeModuleId, to: nextModuleId }
    }));
  }

  async function prepareMount(moduleId, token) {
    root.dataset.renderToken = String(token);
    root.setAttribute('aria-busy', 'true');
    root.dataset.pendingModuleId = moduleId;
    delete root.dataset.activeModuleId;
    root.__tcLastHtml = '';
    const renderLoading = () => {
      if (!isCurrent(token) || !root.hasAttribute?.('aria-busy')) return;
      root.innerHTML = typeof loadingView === 'function'
        ? loadingView(moduleId)
        : '<div class="card tc-module-loading" role="status">Modul wird geladen...</div>';
    };
    clearLoadingTimer();
    const delay = Number(loadingDelayMs);
    if (delay > 0) loadingTimer = globalThis.setTimeout(renderLoading, delay);
    else renderLoading();
    root.dispatchEvent(new CustomEvent('techcalc:module-prepare-mount', {
      bubbles: false,
      detail: { moduleId, token }
    }));
  }

  async function afterMount(moduleId, token) {
    clearLoadingTimer();
    if (!isCurrent(token)) return false;
    root.dataset.activeModuleId = moduleId;
    delete root.dataset.pendingModuleId;
    root.removeAttribute('aria-busy');
    activeModuleId = moduleId;
    renderNavigation?.(moduleId);
    root.dispatchEvent(new CustomEvent('techcalc:module-mounted', {
      bubbles: false,
      detail: { moduleId, token }
    }));
    restorePlatformFocus(root, { select: false });
    return true;
  }

  async function failMount(moduleId, token, error) {
    clearLoadingTimer();
    if (!isCurrent(token)) return false;
    console.error(`Modul konnte nicht geladen werden: ${moduleId}`, error);
    root.__tcLastHtml = '';
    root.innerHTML = '<div class="module-error card">Modul konnte nicht geladen werden.</div>';
    root.removeAttribute('aria-busy');
    delete root.dataset.pendingModuleId;
    return false;
  }

  async function mount(moduleId, options = {}) {
    return preserveModuleSwitchScroll(async () => {
      const module = modules.get(moduleId);
      if (!module) return false;

      const token = ++renderToken;
      await unmount(moduleId);
      await prepareMount(moduleId, token);

      const runtimeContext = Object.freeze({
        moduleId,
        token,
        startedAt: now(),
        addCleanup(cleanup) { normalizeHookResult(cleanup, activeRuntimeCleanups); },
        isCurrent() { return isCurrent(token); }
      });

      try {
        const cleanup = await withTimeout(
          module.mount(root, runtimeContext),
          options.timeoutMs ?? DEFAULT_MOUNT_TIMEOUT_MS,
          `Modul ${moduleId} konnte nicht vollständig gemountet werden.`
        );

        if (!isCurrent(token)) {
          normalizeHookResult(cleanup, activeRuntimeCleanups);
          clearRuntimeCleanups();
          return false;
        }

        activeCleanup = typeof cleanup === 'function' ? cleanup : noop;
        if (cleanup && typeof cleanup !== 'function') normalizeHookResult(cleanup, activeRuntimeCleanups);
        return afterMount(moduleId, token);
      } catch (error) {
        return failMount(moduleId, token, error);
      }
    }, {
      reason: 'module-runtime-switch',
      frames: 10,
      delays: [0, 40, 120, 260, 520]
    });
  }

  function dispose() {
    clearLoadingTimer();
    renderToken += 1;
    try { activeCleanup?.(); } catch { /* dispose is best effort */ }
    activeCleanup = noop;
    clearRuntimeCleanups();
    resetRoot();
    delete root.dataset.activeModuleId;
    delete root.dataset.pendingModuleId;
    root.removeAttribute('aria-busy');
    activeModuleId = '';
  }

  return Object.freeze({
    mount,
    dispose,
    get activeModuleId() { return activeModuleId; },
    get token() { return renderToken; }
  });
}
