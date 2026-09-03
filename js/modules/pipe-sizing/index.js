import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { createPipeSizingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { bindPipeSizingActions, pipeSaveCard } from './controller.js';
import { view } from './view.js';
import { inputContent, resultContent } from './viewModel.js';
import { buildPipeSizingResultModel } from './results.js';

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildPipeSizingResultModel(snapshot, result, 'blue')
});
const calculateForReport = typedReportAdapter.calculate;
const pipeSizingDynamicRenderer = createPipeSizingDynamicRenderer({
  calculate: calculateForReport,
  renderInput: inputContent,
  renderSavedPanel: pipeSaveCard,
  renderResult: resultContent
});

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return view(snapshot);
}

function updatePipeSizingDynamic(root, snapshot, meta = {}) {
  pipeSizingDynamicRenderer.update(root, snapshot, meta);
}

function isDynamicPipeSizingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}
export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindPipeSizingActions,
  dynamicUpdate: updatePipeSizingDynamic,
  isDynamicAction: isDynamicPipeSizingAction,
  report: typedReportAdapter.report
});
