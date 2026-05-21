import { bindCommonInputs } from './renderer.js';

export function mountModule(root, state, view, afterRender) {
  const mountToken = root?.dataset?.renderToken || '';

  const isCurrentMount = () => !mountToken || root?.dataset?.renderToken === mountToken;

  const render = () => {
    if (!isCurrentMount()) return;
    const snapshot = state.get();
    root.innerHTML = view(snapshot);
    bindCommonInputs(root, state);
    if (afterRender) afterRender(root, snapshot, render);
  };

  const unsubscribe = state.subscribe(render);
  render();
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}
