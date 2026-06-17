import config from './config.js';
import { renderModuleShell, stack } from '../../core/renderer.js';
import { calculate } from './logic.js';
import { createRainwaterViewModel } from './viewModel.js';

export function createRainwaterView({ config: moduleConfig = config, calculate: calculateFn = calculate, lineSectionController }) {
  if (!moduleConfig) throw new Error('createRainwaterView requires config');
  if (typeof calculateFn !== 'function') throw new Error('createRainwaterView requires calculate');
  if (!lineSectionController) throw new Error('createRainwaterView requires lineSectionController');

  function view(s = {}) {
    const r = calculateFn(s);
    const vm = createRainwaterViewModel(s, r);

    const inputColumn = stack([
      `<div class="tc-stack" data-rw-dynamic="form">${vm.formHtml}</div>`,
      lineSectionController.renderCard(s)
    ].join(''));

    const outputColumn = stack([
      `<div class="tc-stack" data-rw-dynamic="result">${vm.resultHtml}</div>`
    ].join(''));

    return renderModuleShell(moduleConfig, `
      <div class="span-6">${inputColumn}</div>
      <div class="span-6">${outputColumn}</div>
    `);
  }

  const dynamicRenderers = {
    renderForm: (s, r) => createRainwaterViewModel(s, r).formHtml,
    renderResult: (s, r) => createRainwaterViewModel(s, r).resultHtml
  };

  return { view, dynamicRenderers };
}

export default createRainwaterView;
