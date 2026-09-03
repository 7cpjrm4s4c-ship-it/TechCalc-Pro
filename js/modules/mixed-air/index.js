import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindMixedAirActions } from './controller.js';
import { renderView } from './view.js';
import { isDynamicMixedAirAction, updateMixedAirDynamic } from './dynamicRenderer.js';

const typedReportAdapter = createTypedDtoReportAdapter({ config, schema, state, calculate });
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateMixedAirDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindMixedAirActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicMixedAirAction,
  report: typedReportAdapter.report
});
