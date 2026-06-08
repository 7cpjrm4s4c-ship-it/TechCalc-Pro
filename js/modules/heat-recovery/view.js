import config from './config.js';
import { card, field, segmented, renderModuleShell, stack, grid, signedTempField, esc } from '../../core/renderer.js';
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

export function renderModeCard(vm){
  return card('Berechnungsart', segmented('mode', vm.modeOptions, vm.state.mode, { accent: vm.accent }), vm.accent, { compact: true });
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

export function renderMixingInputCard(vm) {
  return card('Mischluft — Eingaben', `<div class="wrg-group-grid">
    ${airInputCard(vm.mixing.outdoor, vm.accent)}
    ${airInputCard(vm.mixing.recirc, vm.accent)}
  </div>`, vm.accent);
}

export function renderInputs(vm){
  return vm.isMixing ? renderMixingInputCard(vm) : renderWrgInputCard(vm);
}

export function renderOutputs(vm){
  return stack(renderResultModel(vm.resultModel, vm.accent));
}

export function renderSavedRecords(vm){
  return rltDeviceCard(vm.state);
}

export function renderView(s) {
  const vm = createHeatRecoveryViewModel(s);
  const body = stack([
    `<div data-wrg-dynamic="mode">${renderModeCard(vm)}</div>`,
    `<div class="wrg-desktop-split">
      <div class="wrg-desktop-split__input tc-stack"><div data-wrg-dynamic="inputs">${renderInputs(vm)}</div><div data-wrg-dynamic="formula" class="formula">${esc(vm.formula)}</div></div>
      <div class="wrg-desktop-split__output tc-stack"><div data-wrg-dynamic="outputs">${renderOutputs(vm)}</div><div data-wrg-dynamic="rlt-devices">${renderSavedRecords(vm)}</div></div>
    </div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}


export default renderView;
