import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results, savedRecords } from './results.js';
import controller, { bindWastewaterSavedActions } from './controller.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  results,
  savedRecords,
  controller,
  bind: bindWastewaterSavedActions
});
