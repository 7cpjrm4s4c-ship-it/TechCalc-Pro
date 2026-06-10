import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import {
  bindVentilationPlatform,
  isDynamicVentilationAction,
  updateVentilationDynamic,
  ventilationLineSectionController
} from './controller.js';
import { createVentilationView } from './view.js';

const view = createVentilationView(config, calculate, ventilationLineSectionController);

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindVentilationPlatform,
  dynamicUpdate: updateVentilationDynamic,
  isDynamicAction: isDynamicVentilationAction
});
