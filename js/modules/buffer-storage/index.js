import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { bindBufferStorageActions } from './controller.js';
import { isDynamicBufferStorageAction, renderView, updateBufferStorageDynamic } from './view.js';

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view: renderView,
  bind: bindBufferStorageActions,
  dynamicUpdate: updateBufferStorageDynamic,
  isDynamicAction: isDynamicBufferStorageAction
});
