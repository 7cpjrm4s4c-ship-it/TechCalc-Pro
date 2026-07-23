import config from './config.js';
import { card, field, renderModuleShell, stack, grid, signedTempField, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createHeatRecoveryViewModel } from './viewModel.js';
import { rltDeviceCard } from './controller.js';

function airInputCard(group, accent = 'cyan') {
  const rows = [];
  if (group.volume) rows.push(field(group.volume));
  rows.push(grid([
    group.temp?.signed ? signedTempField(group.temp.id, group.temp.label, group.temp.value, 'data-wrg-sign') : field(group.temp),
    field(group.rh)
  ].join(''), 2));
  return card(group.title, stack(rows.join('')), accent);
}

export function renderWrgInputCard(vm) {
  return card('WRG — Eingaben', `<div class="wrg-group-grid">
    ${airInputCard(vm.wrg.outdoor, vm.accent)}
    ${airInputCard(vm.wrg.extract, vm.accent)}
    <div class="wrg-group-grid__full">
      ${card('Wärmerückgewinnung', grid(vm.wrg.heatRecovery.map(item => field(item)).join(''), 3), vm.accent, { compact: true })}
    </div>
  </div>`, vm.accent);
}

export function renderInputs(vm){
  return renderWrgInputCard(vm);
}

export function renderOutputs(vm){
  return renderResultModel(vm.resultModel, vm.accent);
}

export function renderSavedRecords(vm){
  return rltDeviceCard(vm.state);
}

export function renderView(s) {
  const vm = createHeatRecoveryViewModel(s);
  return renderModuleShell(config, `<div class="tc-module-layout tc-module-layout--2 wrg-desktop-split">
    <div class="tc-module-column wrg-desktop-split__input">
      <div class="tc-module-section" data-wrg-dynamic="inputs">${renderInputs(vm)}</div>
      <div class="tc-module-section" data-wrg-dynamic="rlt-devices">${renderSavedRecords(vm)}</div>
      <div class="tc-module-section formula" data-wrg-dynamic="formula">${esc(vm.formula)}</div>
    </div>
    <div class="tc-module-column wrg-desktop-split__output"><div class="tc-module-section" data-wrg-dynamic="outputs">${renderOutputs(vm)}</div></div>
  </div>`);
}

export default renderView;