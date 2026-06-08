import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createBufferStorageDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindBufferStorageActions } from './controller.js';
import { createBufferStorageViewModel } from './viewModel.js';
import { renderInputBlocks, renderMediumContent, renderResultContent, renderSavedRecords, renderView } from './view.js';

const renderWithViewModel = renderer => (s, r) => renderer(createBufferStorageViewModel(s, r));

const bufferStorageDynamicRenderer = createBufferStorageDynamicRenderer({
  calculate,
  fmt,
  fmtInput,
  renderMedium: renderWithViewModel(renderMediumContent),
  renderInputBlocks: renderWithViewModel(renderInputBlocks),
  renderSavedPanel: renderWithViewModel(renderSavedRecords),
  renderResult: renderWithViewModel(renderResultContent)
});

function updateBufferStorageDynamic(root, s, meta = {}) {
  bufferStorageDynamicRenderer.update(root, s, meta);
}

function isDynamicBufferStorageAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

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
