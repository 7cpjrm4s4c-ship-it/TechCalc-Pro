import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import {
  bindVentilationPlatform,
  isDynamicVentilationAction,
  updateVentilationDynamic,
  ventilationLineSectionController
} from './controller.js';
import { activeCalculationState } from './viewModel.js';
import { createVentilationView } from './view.js';

const typedReportAdapter = createTypedDtoReportAdapter({ config, schema, state, calculate });
const calculateForReport = typedReportAdapter.calculate;
const view = createVentilationView(config, calculateForReport, ventilationLineSectionController);

function updateVentilationTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(activeCalculationState(snapshot));
  updateVentilationDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view,
  bind: bindVentilationPlatform,
  dynamicUpdate: updateVentilationTypedDynamic,
  isDynamicAction: isDynamicVentilationAction,
  report: typedReportAdapter.report
});
