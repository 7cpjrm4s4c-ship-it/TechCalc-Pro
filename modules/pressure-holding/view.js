import config from './config.js';
import { card, renderModuleShell, stack } from '../../core/renderer.js';
import { calculate } from './logic.js';
import { createPressureHoldingViewModel } from './viewModel.js';

export function view(s){
  const r = calculate(s);
  const vm = createPressureHoldingViewModel(s, r);
  const inputColumn = stack([
    card('Berechnungsart', `<div data-ph-dynamic="basis">${vm.basisHtml}</div>`, 'purple'),
    card(vm.holdingOptionsTitle, `<div data-ph-dynamic="holding-options">${vm.holdingOptionsHtml}</div>`, 'purple'),
    card('Anlagenvolumen', `<div data-ph-dynamic="volume-fields">${vm.volumeFieldsHtml}</div>`, 'purple'),
    card('Temperaturen / Stoffwerte', `<div data-ph-dynamic="temperature-fields">${vm.temperatureFieldsHtml}</div>`, 'purple'),
    card('Druckdaten', `<div data-ph-dynamic="pressure-fields">${vm.pressureFieldsHtml}</div>`, 'purple'),
    `<div class="tc-module-section" data-ph-dynamic="saved-records">${vm.savedRecordsHtml}</div>`
  ].join(''));

  return renderModuleShell(config, `<div class="tc-module-layout tc-module-layout--2"><div class="tc-module-column">${inputColumn}</div><div class="tc-module-column"><div class="tc-module-section" data-ph-dynamic="result">${vm.resultHtml}</div></div></div>`);
}

export default view;
