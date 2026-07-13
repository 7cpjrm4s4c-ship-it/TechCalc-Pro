import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import controller, { editSurface } from './controller.js';
import { savedVerificationModel } from './savedRecords.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

function bindFloodingVerification(root) {
  if (!root || root.__tcFloodingEditBound) return;
  root.__tcFloodingEditBound = true;
  root.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-tc-action="platform:collection:edit"]');
    if (!button || !root.contains(button) || button.dataset.collection !== 'surfaces') return;
    event.preventDefault();
    event.stopPropagation();
    const patch = editSurface({ id: button.dataset.collectionId, current: state.get() });
    if (Object.keys(patch).length) state.set(patch, { action: 'flooding:surface:edit', notify: true });
  }, true);
}

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  results,
  savedRecords: savedVerificationModel,
  controller,
  bind: bindFloodingVerification
});
