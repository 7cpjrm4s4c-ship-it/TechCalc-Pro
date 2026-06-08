import config from './config.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, signedTempField, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createHeatRecoveryViewModel } from './viewModel.js';
import { rltDeviceCard } from './controller.js';

function setIslandInner(root, selector, html){
  const island = root?.querySelector?.(selector);
  if (!island) return false;
  const next = String(html ?? '');
  if (island.innerHTML !== next) island.innerHTML = next;
  return true;
}

function setInputValue(root, fieldName, value){
  const el = root?.querySelector?.(`input[data-field="${fieldName}"]`);
  if (!el || document.activeElement === el) return;
  const next = String(value ?? '');
  if (el.value !== next) el.value = next;
}

function updateSegment(root, name, value){
  root?.querySelectorAll?.(`[data-segment="${name}"]`)?.forEach(button => {
    const selected = String(button.dataset.value) === String(value);
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}


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
  return renderResultModel(vm.resultModel, vm.accent);
}

export function renderSavedRecords(vm){
  return rltDeviceCard(vm.state);
}

export function renderView(s) {
  const vm = createHeatRecoveryViewModel(s);
  const body = stack([
    `<div data-wrg-dynamic="mode">${renderModeCard(vm)}</div>`,
    `<div class="wrg-desktop-split">
      <div class="wrg-desktop-split__input"><div data-wrg-dynamic="inputs">${renderInputs(vm)}</div><div data-wrg-dynamic="formula" class="formula">${esc(vm.formula)}</div></div>
      <div class="wrg-desktop-split__output"><div data-wrg-dynamic="outputs">${renderOutputs(vm)}</div><div data-wrg-dynamic="rlt-devices">${renderSavedRecords(vm)}</div></div>
    </div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

function syncFields(root, s = {}){
  updateSegment(root, 'mode', s.mode);
  ['activeRltDeviceName','wrgVolumeFlowM3h','outdoorTemp','outdoorRh','extractTemp','extractRh','efficiency','bypassPercent','mixingOutdoorVolumeFlowM3h','mixingOutdoorTemp','mixingOutdoorRh','mixingRecircVolumeFlowM3h','mixingRecircTemp','mixingRecircRh']
    .forEach(key => setInputValue(root, key, s[key] ?? ''));
}

export function updateHeatRecoveryDynamic(root, s, meta = {}) {
  const vm = createHeatRecoveryViewModel(s, calculate(s));
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  const action = String(meta.action || '');
  const previous = root.__tcHeatRecoveryDynamic || {};
  const modeChanged = previous.mode !== s.mode || changed.includes('mode');
  const savedStructural = /^(line:|saved:|rlt:)/.test(action) || changed.some(key => ['savedRltDevices','activeRltDeviceId','activeRltDeviceName','expandedRltDeviceId','rltDevices'].includes(key));

  if (modeChanged) {
    setIslandInner(root, '[data-wrg-dynamic="mode"]', renderModeCard(vm));
    setIslandInner(root, '[data-wrg-dynamic="inputs"]', renderInputs(vm));
    setIslandInner(root, '[data-wrg-dynamic="formula"]', esc(vm.formula));
  }

  setIslandInner(root, '[data-wrg-dynamic="outputs"]', renderOutputs(vm));
  if (savedStructural) setIslandInner(root, '[data-wrg-dynamic="rlt-devices"]', renderSavedRecords(vm));
  syncFields(root, s);
  root.__tcHeatRecoveryDynamic = { mode: s.mode, activeRltDeviceId: s.activeRltDeviceId, expandedRltDeviceId: s.expandedRltDeviceId };
}

export function isDynamicHeatRecoveryAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default renderView;
