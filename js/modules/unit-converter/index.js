import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createUnitConverterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmt } from '../../utils/calculations.js';
import { normalizeUnitSelection } from './results.js';
import { conversionContent, resultContent } from './viewModel.js';
import { view } from './view.js';

const unitConverterDynamicRenderer = createUnitConverterDynamicRenderer({
  calculate,
  fmt,
  normalizeUnitSelection,
  renderConversion: conversionContent,
  renderResult: resultContent
});

function updateUnitConverterDynamic(root, s, meta = {}) {
  unitConverterDynamicRenderer.update(root, s, meta);
}

function isDynamicUnitConverterAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  dynamicUpdate: updateUnitConverterDynamic,
  isDynamicAction: isDynamicUnitConverterAction
});
