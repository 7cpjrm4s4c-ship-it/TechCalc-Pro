import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { bindDrinkingWaterActions } from './controller.js';
import { renderView } from './view.js';
import { updateDrinkingWaterDynamic, isDynamicDrinkingWaterAction } from './dynamicRenderer.js';

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view: renderView,
  bind: bindDrinkingWaterActions,
  dynamicUpdate: updateDrinkingWaterDynamic,
  isDynamicAction: isDynamicDrinkingWaterAction
});
