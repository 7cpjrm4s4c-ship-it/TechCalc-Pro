import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createPressureHoldingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmtInput } from '../../utils/calculations.js';
import { bindPressureHoldingActions, savedPlantsCard } from './controller.js';
import { view } from './view.js';
import {
  basisContent,
  volumeFieldsContent,
  pressureFieldsContent,
  holdingOptionsContent,
  resultContent
} from './viewModel.js';

const pressureHoldingDynamicRenderer = createPressureHoldingDynamicRenderer({
  calculate,
  fmtInput,
  renderBasis: basisContent,
  renderVolumeFields: volumeFieldsContent,
  renderPressureFields: pressureFieldsContent,
  renderHoldingOptions: holdingOptionsContent,
  renderSavedPanel: savedPlantsCard,
  renderResult: resultContent
});

function updatePressureHoldingDynamic(root, s, meta = {}) {
  pressureHoldingDynamicRenderer.update(root, s, meta);
}

function isDynamicPressureHoldingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: root => bindPressureHoldingActions(root, { state, calculate }),
  dynamicUpdate: updatePressureHoldingDynamic,
  isDynamicAction: isDynamicPressureHoldingAction
});
