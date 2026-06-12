import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import {
  bindWastewaterPlatform,
  isDynamicWastewaterAction,
  updateWastewaterDynamic,
  wastewaterSavedController
} from './controller.js';
import { createWastewaterView } from './view.js';

const view = createWastewaterView(config, calculate, wastewaterSavedController);

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  view,
  bind: bindWastewaterPlatform,
  dynamicUpdate: updateWastewaterDynamic,
  isDynamicAction: isDynamicWastewaterAction
});
