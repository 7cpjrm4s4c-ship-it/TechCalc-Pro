import { on, createEventScope } from './eventManager.js';
export function delegate(root, eventName, selector, handler, options) {
  if (!root) return () => {};
  const listener = event => {
    const target = event.target?.closest?.(selector);
    if (!target || !root.contains(target)) return;
    handler(event, target);
  };
  return on(root, eventName, listener, options);
}

export function createDelegationScope(root) {
  const scope = createEventScope('delegation-scope');
  return {
    on(eventName, selector, handler, options) {
      scope.add(delegate(root, eventName, selector, handler, options));
    },
    destroy() {
      scope.dispose();
    }
  };
}
