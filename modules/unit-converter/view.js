import config from './config.js';
import { card, renderModuleShell } from '../../core/renderer.js';
import { createUnitConverterViewModel } from './viewModel.js';

export function view(s) {
  const vm = createUnitConverterViewModel(s);
  const conversionCard = card('Kategorie wählen', `<div data-unit-dynamic="conversion">${vm.conversionHtml}</div>`, 'blue');

  return renderModuleShell(config, `
    <div class="tc-module-layout tc-module-layout--2">
      <div class="tc-module-column">
        <div class="tc-module-section">${conversionCard}</div>
      </div>
      <div class="tc-module-column">
        <div class="tc-module-section" data-unit-dynamic="result">${vm.resultHtml}</div>
      </div>
    </div>
  `);
}

export default view;
