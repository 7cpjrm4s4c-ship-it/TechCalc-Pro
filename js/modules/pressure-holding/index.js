import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { createPressureHoldingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmtInput } from '../../utils/calculations.js';
import { bindPressureHoldingActions, savedPlantsCard } from './controller.js';
import { buildPressureHoldingResultModel } from './results.js';
import { view } from './view.js';
import {
  basisContent,
  volumeFieldsContent,
  pressureFieldsContent,
  holdingOptionsContent,
  resultContent
} from './viewModel.js';

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildPressureHoldingResultModel(snapshot, result)
});
const calculateForReport = typedReportAdapter.calculate;
const pressureHoldingDynamicRenderer = createPressureHoldingDynamicRenderer({
  calculate: calculateForReport,
  fmtInput,
  renderBasis: basisContent,
  renderVolumeFields: volumeFieldsContent,
  renderPressureFields: pressureFieldsContent,
  renderHoldingOptions: holdingOptionsContent,
  renderSavedPanel: savedPlantsCard,
  renderResult: resultContent
});

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return view(snapshot);
}

function updatePressureHoldingDynamic(root, snapshot, meta = {}) {
  pressureHoldingDynamicRenderer.update(root, snapshot, meta);
}
function isDynamicPressureHoldingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: root => bindPressureHoldingActions(root, { state, calculate: calculateForReport }),
  dynamicUpdate: updatePressureHoldingDynamic,
  isDynamicAction: isDynamicPressureHoldingAction,
  report: typedReportAdapter.report
});
