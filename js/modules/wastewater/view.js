import { renderModuleShell } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { results } from './results.js';
import { createWastewaterViewModel } from './viewModel.js';

export function createWastewaterView(config, calculate, wastewaterSavedController) {
  return function view(s) {
    const r = calculate(s);
    const vm = createWastewaterViewModel(s, r);

    return renderModuleShell(config, `
      <div class="span-8">
        ${renderResultModel(results(s, r), 'green')}
      </div>
      <div class="span-4" data-platform-dynamic="saved-records">
        ${vm.savedRecordsHtml}
      </div>
    `);
  };
}

export default createWastewaterView;
