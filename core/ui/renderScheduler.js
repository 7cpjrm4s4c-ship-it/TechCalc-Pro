const queues = new WeakMap();

export function createRenderScheduler(root, renderFn) {
  let rafId = 0;
  let pendingReason = '';
  let disposed = false;

  const flush = () => {
    rafId = 0;
    if (disposed) return;
    const reason = pendingReason;
    pendingReason = '';
    renderFn?.({ reason });
  };

  const scheduler = {
    schedule(reason = 'state-change') {
      if (disposed) return;
      pendingReason = pendingReason || reason;
      if (rafId) return;
      rafId = requestAnimationFrame(flush);
    },
    flushNow(reason = 'sync') {
      if (disposed) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      pendingReason = reason;
      flush();
    },
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  if (root) queues.set(root, scheduler);
  return scheduler;
}

export function getRenderScheduler(root) {
  return root ? queues.get(root) || null : null;
}

export function batchDOMUpdates(callback) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const value = callback?.();
      requestAnimationFrame(() => resolve(value));
    });
  });
}
