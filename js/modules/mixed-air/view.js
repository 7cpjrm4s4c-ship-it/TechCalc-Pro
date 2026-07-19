import config from './config.js';
import { card, field, renderModuleShell, stack, grid, signedTempField, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createMixedAirViewModel } from './viewModel.js';
import { mixedAirSaveCard } from './controller.js';

function airInputCard(group, accent = 'cyan') {
  const rows = [];
  if (group.volume) rows.push(field(group.volume));
  rows.push(grid([
    group.temp?.signed ? signedTempField(group.temp.id, group.temp.label, group.temp.value, 'data-mixed-air-sign') : field(group.temp),
    field(group.rh)
  ].join(''), 2));
  return card(group.title, stack(rows.join('')), accent);
}

export function renderMixedAirInputCard(vm) {
  return card('Mischluft — Eingaben', `<div class="wrg-group-grid">
    ${airInputCard(vm.mixing.outdoor, vm.accent)}
    ${airInputCard(vm.mixing.recirc, vm.accent)}
  </div>`, vm.accent);
}

export function renderInputs(vm){
  return renderMixedAirInputCard(vm);
}

export function renderOutputs(vm){
  return renderResultModel(vm.resultModel, vm.accent);
}

export function renderView(s) {
  const vm = createMixedAirViewModel(s);
  return renderModuleShell(config, `<div class="tc-module-layout tc-module-layout--2 wrg-desktop-split">
    <div class="tc-module-column wrg-desktop-split__input">
      <div class="tc-module-section" data-mixed-air-dynamic="inputs">${renderInputs(vm)}</div>
      <div class="tc-module-section" data-mixed-air-dynamic="saved-panel">${mixedAirSaveCard(s)}</div>
      <div class="tc-module-section formula" data-mixed-air-dynamic="formula">${esc(vm.formula)}</div>
    </div>
    <div class="tc-module-column wrg-desktop-split__output"><div class="tc-module-section" data-mixed-air-dynamic="outputs">${renderOutputs(vm)}</div></div>
  </div>`);
}

export default renderView;