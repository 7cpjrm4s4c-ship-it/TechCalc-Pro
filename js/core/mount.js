import { bindCommonInputs } from './renderer.js';

export function mountModule(root, state, view, afterRender) {
  const render = () => {
    const snapshot = state.get();
    root.innerHTML = view(snapshot);
    bindCommonInputs(root, state);
    if (afterRender) afterRender(root, snapshot, render);
  };

  state.subscribe(render);
  render();
}
