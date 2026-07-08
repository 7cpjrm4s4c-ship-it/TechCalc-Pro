import config from './config.js';
import { card, field, renderModuleShell, stack, grid, signedTempField, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createMixedAirViewModel } from './viewModel.js';

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
  return stack(renderResultModel(vm.resultModel, vm.accent));
}

export function renderView(s) {
  const vm = createMixedAirViewModel(s);
  const body = stack([
    `<div class="wrg-desktop-split">
      <div class="wrg-desktop-split__input tc-stack"><div data-mixed-air-dynamic="inputs">${renderInputs(vm)}</div><div data-mixed-air-dynamic="formula" class="formula">${esc(vm.formula)}</div></div>
      <div class="wrg-desktop-split__output tc-stack"><div data-mixed-air-dynamic="outputs">${renderOutputs(vm)}</div></div>
    </div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

export default renderView;
