import config from './config.js';
import { card, renderModuleShell } from '../../core/renderer.js';
import { calculate } from './logic.js';
import { createPipeSizingViewModel } from './viewModel.js';

export function view(s) {
  const r = calculate(s);
  const vm = createPipeSizingViewModel(s, r);
  const inputCard = card('Basisdaten', `<div data-pipe-dynamic="input">${vm.inputHtml}</div>`, 'blue');

  return renderModuleShell(config, `
    <div class="span-6">${inputCard}<div class="formula">≤ DN50: DIN EN 10255 · ≥ DN65: DIN EN 10220</div><div data-pipe-dynamic="saved-records">${vm.savedRecordsHtml}</div></div>
    <div class="span-6"><div data-pipe-dynamic="result">${vm.resultHtml}</div><div class="formula">Auslegung nach Druckverlustgrenze</div></div>
  `);
}

export default view;
