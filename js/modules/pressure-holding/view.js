import config from './config.js';
import { card, renderModuleShell, stack } from '../../core/renderer.js';
import { calculate } from './logic.js';
import { createPressureHoldingViewModel } from './viewModel.js';

export function view(s){
  const r = calculate(s);
  const vm = createPressureHoldingViewModel(s, r);
  const inputColumn = stack([
    card('Berechnungsart', `<div data-ph-dynamic="basis">${vm.basisHtml}</div>`, 'purple'),
    `<div data-ph-dynamic="saved-records">${vm.savedRecordsHtml}</div>`,
    card('Anlagenvolumen', `<div data-ph-dynamic="volume-fields">${vm.volumeFieldsHtml}</div>`, 'purple'),
    card('Temperaturen / Stoffwerte', `<div data-ph-dynamic="temperature-fields">${vm.temperatureFieldsHtml}</div>`, 'purple'),
    card('Druckdaten', `<div data-ph-dynamic="pressure-fields">${vm.pressureFieldsHtml}</div>`, 'purple'),
    card(vm.holdingOptionsTitle, `<div data-ph-dynamic="holding-options">${vm.holdingOptionsHtml}</div>`, 'purple')
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6" data-ph-dynamic="result">${vm.resultHtml}</div>`);
}

export default view;
