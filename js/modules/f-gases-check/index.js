import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { buildFGasesResultModel } from './results.js';
import { buildFGasesReportDto } from './reportAdapter.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { renderView } from './view.js';

function report(snapshot = state.get()) {
  return buildFGasesReportDto({ state: snapshot, calculation: calculate(snapshot) });
}

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  results: buildFGasesResultModel,
  report,
  view: renderView
});
