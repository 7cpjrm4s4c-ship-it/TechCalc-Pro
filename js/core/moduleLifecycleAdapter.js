const CLEANUP_KEYS = [
  '__tcCentralEventPipelineCleanup',
  '__tcRainwaterLookupHydrationCleanup',
];

function runCleanupTask(task) {
  try {
    if (typeof task === 'function') task();
    else if (typeof task?.dispose === 'function') task.dispose();
    else if (typeof task?.destroy === 'function') task.destroy();
    else if (typeof task?.unmount === 'function') task.unmount();
  } catch (error) {
    console.warn('Modul-Lifecycle-Cleanup konnte nicht vollständig ausgeführt werden.', error);
  }
}

function resetRootLifecycleState(root) {
  if (!root) return;

  // Abort resources owned by the previous module before any new mount starts.
  try { root.__tcModuleLifecycle?.abortController?.abort?.(); } catch { /* abort is best effort */ }

  for (const key of CLEANUP_KEYS) {
    try { root[key]?.(); } catch { /* stale module cleanup is best effort */ }
    root[key] = null;
  }

  root.__tcCentralEventPipelineBound = false;
  root.__tcCentralEventPipelineState = null;
  root.__tcRainwaterLookupHydrationBound = false;
  root.__tcActionHandlers = {};
  root.__tcTouchGesture = null;
  root.__tcPointerGesture = null;
  // DOM render cache belongs to the currently mounted markup. It must be
  // cleared before every module transition because legacy and fully migrated
  // modules do not all use the same low-level renderer yet.
  root.__tcLastHtml = '';

  if (root.dataset) {
    delete root.dataset.tcPointerAction;
    delete root.dataset.tcPointerActionAt;
    delete root.dataset.tcSuppressTouchClickAt;
    delete root.dataset.tcSuppressPointerActionAt;
    delete root.dataset.tcCommittedActionAt;
  }
}

function normalizeCleanup(cleanup, cleanups) {
  if (!cleanup) return;
  if (Array.isArray(cleanup)) {
    cleanup.forEach(item => normalizeCleanup(item, cleanups));
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

export function createModuleLifecycleAdapter(moduleId, mount) {
  if (typeof mount !== 'function') {
    throw new Error(`Modul "${moduleId}" besitzt keine gültige mount-Funktion.`);
  }

  return async function mountWithLifecycle(root) {
    resetRootLifecycleState(root);

    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const cleanups = [];
    const lifecycle = {
      moduleId,
      signal: abortController?.signal,
      addCleanup(cleanup) { normalizeCleanup(cleanup, cleanups); },
      onCleanup(cleanup) { normalizeCleanup(cleanup, cleanups); },
      isAborted() { return Boolean(abortController?.signal?.aborted); }
    };

    if (root) {
      root.__tcModuleLifecycle = {
        moduleId,
        abortController,
        cleanups,
        mounted: false
      };
    }

    try {
      const cleanup = await Promise.resolve(mount(root, lifecycle));
      normalizeCleanup(cleanup, cleanups);
      if (root?.__tcModuleLifecycle?.moduleId === moduleId) {
        root.__tcModuleLifecycle.mounted = true;
      }
    } catch (error) {
      if (abortController?.signal?.aborted) return () => {};
      throw error;
    }

    return () => {
      try { abortController?.abort?.(); } catch { /* abort is best effort */ }
      for (let index = cleanups.length - 1; index >= 0; index -= 1) {
        runCleanupTask(cleanups[index]);
      }
      cleanups.length = 0;
      if (root?.__tcModuleLifecycle?.moduleId === moduleId) {
        root.__tcModuleLifecycle = null;
      }
      resetRootLifecycleState(root);
    };
  };
}

export function hardResetModuleRoot(root) {
  resetRootLifecycleState(root);
}
