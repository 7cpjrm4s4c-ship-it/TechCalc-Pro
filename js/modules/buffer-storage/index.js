import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindBufferStorageActions } from './controller.js';
import { buildBufferStorageResultModel } from './results.js';
import { isDynamicBufferStorageAction, renderView, updateBufferStorageDynamic } from './view.js';

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildBufferStorageResultModel(snapshot, result)
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateBufferStorageDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindBufferStorageActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicBufferStorageAction,
  report: typedReportAdapter.report
});
