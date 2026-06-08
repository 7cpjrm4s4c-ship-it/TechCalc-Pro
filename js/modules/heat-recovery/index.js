import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { bindHeatRecoveryActions } from './controller.js';
import { isDynamicHeatRecoveryAction, renderView, updateHeatRecoveryDynamic } from './view.js';

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view: renderView,
  bind: bindHeatRecoveryActions,
  dynamicUpdate: updateHeatRecoveryDynamic,
  isDynamicAction: isDynamicHeatRecoveryAction
});
