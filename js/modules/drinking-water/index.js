import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindDrinkingWaterActions } from './controller.js';
import { renderView } from './view.js';
import { updateDrinkingWaterDynamic, isDynamicDrinkingWaterAction } from './dynamicRenderer.js';

const typedReportAdapter = createTypedDtoReportAdapter({ config, schema, state, calculate });
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateDrinkingWaterDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindDrinkingWaterActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicDrinkingWaterAction,
  report: typedReportAdapter.report
});
