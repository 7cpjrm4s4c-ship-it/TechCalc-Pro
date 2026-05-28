export function delegate(root, eventName, selector, handler, options) {
  if (!root) return () => {};
  const listener = event => {
    const target = event.target?.closest?.(selector);
    if (!target || !root.contains(target)) return;
    handler(event, target);
  };
  root.addEventListener(eventName, listener, options);
  return () => root.removeEventListener(eventName, listener, options);
}

export function createDelegationScope(root) {
  const cleanup = [];
  return {
    on(eventName, selector, handler, options) {
      cleanup.push(delegate(root, eventName, selector, handler, options));
    },
    destroy() {
      while (cleanup.length) cleanup.pop()?.();
    }
  };
}
