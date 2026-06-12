import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import controller, { bindRainwaterPlatform } from './controller.js';
import { view } from './view.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

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
  isDynamicAction: () => false
});
