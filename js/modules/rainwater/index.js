import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import controller, {
  bindRainwaterPlatform,
  isDynamicRainwaterAction,
  rainwaterSavedController,
  updateRainwaterDynamic
} from './controller.js';
import { createRainwaterView } from './view.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

const { view } = createRainwaterView({
  config,
  calculate,
  lineSectionController: rainwaterSavedController
});

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  results,
  controller,
  view,
  bind: bindRainwaterPlatform,
  dynamicUpdate: updateRainwaterDynamic,
  isDynamicAction: isDynamicRainwaterAction
});
