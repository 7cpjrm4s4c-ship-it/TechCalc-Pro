import config from './config.js';
import { renderModuleShell, stack } from '../../core/renderer.js';
import { calculate } from './logic.js';
import { createRainwaterViewModel } from './viewModel.js';
import { renderDebugCard } from '../../platform/debugPanel/index.js';

export function view(s = {}) {
  const r = calculate(s);
  const vm = createRainwaterViewModel(s, r);
  const inputColumn = stack([
    `<div data-rw-dynamic="form">${vm.formHtml}</div>`,
    `<div data-rw-dynamic="saved-records">${vm.savedRecordsHtml}</div>`,
    `<div data-debug-panel>${renderDebugCard()}</div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-6 tc-module-column">${inputColumn}</div><div class="span-6 tc-module-column"><div data-rw-dynamic="result">${vm.resultHtml}</div></div>`);
}

export default view;
