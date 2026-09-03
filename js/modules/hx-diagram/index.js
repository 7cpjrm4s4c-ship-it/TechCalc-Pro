import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindHxDiagramActions } from './controller.js';
import { renderView } from './view.js';
import { isDynamicHxDiagramAction, updateHxDiagramDynamic } from './dynamicRenderer.js';

const typedReportAdapter = createTypedDtoReportAdapter({ config, schema, state, calculate });
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateHxDiagramDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindHxDiagramActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicHxDiagramAction,
  report: typedReportAdapter.report
});
