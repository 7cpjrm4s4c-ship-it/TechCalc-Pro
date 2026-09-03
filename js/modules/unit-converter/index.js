import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { createUnitConverterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmt } from '../../utils/calculations.js';
import { normalizeUnitSelection } from './results.js';
import { conversionContent, resultContent } from './viewModel.js';
import { view } from './view.js';
import controller from './controller.js';

const typedReportAdapter = createTypedDtoReportAdapter({ config, schema, state, calculate });
const calculateForReport = typedReportAdapter.calculate;
const unitConverterDynamicRenderer = createUnitConverterDynamicRenderer({
  calculate: calculateForReport,
  fmt,
  normalizeUnitSelection,
  renderConversion: conversionContent,
  renderResult: resultContent
});

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return view(snapshot);
}

function updateUnitConverterDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  unitConverterDynamicRenderer.update(root, snapshot, meta);
}

function isDynamicUnitConverterAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}
export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  controller,
  view: renderTypedView,
  dynamicUpdate: updateUnitConverterDynamic,
  isDynamicAction: isDynamicUnitConverterAction,
  report: typedReportAdapter.report
});
