import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createPipeSizingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { bindPipeSizingActions, pipeSaveCard } from './controller.js';
import { view } from './view.js';
import { inputContent, resultContent } from './viewModel.js';

const pipeSizingDynamicRenderer = createPipeSizingDynamicRenderer({
  calculate,
  renderInput: inputContent,
  renderSavedPanel: pipeSaveCard,
  renderResult: resultContent
});

function updatePipeSizingDynamic(root, s, meta = {}) {
  pipeSizingDynamicRenderer.update(root, s, meta);
}

function isDynamicPipeSizingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindPipeSizingActions,
  dynamicUpdate: updatePipeSizingDynamic,
  isDynamicAction: isDynamicPipeSizingAction
});
