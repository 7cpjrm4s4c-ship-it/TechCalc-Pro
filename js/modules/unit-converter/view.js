import config from './config.js';
import { card, renderModuleShell } from '../../core/renderer.js';
import { createUnitConverterViewModel } from './viewModel.js';

export function view(s) {
  const vm = createUnitConverterViewModel(s);
  const conversionCard = card('Kategorie wählen', `<div data-unit-dynamic="conversion">${vm.conversionHtml}</div>`, 'green');

  return renderModuleShell(config, `
    <div class="span-6">${conversionCard}</div>
    <div class="span-6"><div data-unit-dynamic="result">${vm.resultHtml}</div></div>
  `);
}

export default view;
