import config from './config.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, signedTempField, esc } from '../../core/renderer.js';
import { fmt } from '../../utils/calculations.js';
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

function readonlyValue({ label, value, unit = '' }) {
  return `<div class="field field--readonly"><label>${esc(label)}</label><div class="control control--readonly"><strong>${esc(value)}</strong>${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div></div>`;
}

function readonlyAirCard(title, point, accent = 'cyan', options = {}) {
  const includeMass = options.includeMass !== false;
  const includeVolume = options.includeVolume === true;
  const rows = [];

  if (includeVolume) rows.push(readonlyValue({ label: 'Volumenstrom V̇', value: fmt(point?.volumeFlowM3h, 0), unit: 'm³/h' }));
  if (includeMass) rows.push(readonlyValue({ label: 'Massenstrom ṁ', value: fmt(point?.massFlowKgh, 2), unit: 'kg/h' }));

  rows.push(grid([
    readonlyValue({ label: 'Temperatur', value: fmt(point?.tempC, 2), unit: '°C' }),
    readonlyValue({ label: 'rel. Feuchte', value: fmt(point?.rhPercent, 0), unit: '%' })
  ].join(''), 2));

  return card(title, stack(rows.join('')), accent);
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

function condensationCard(r, accent = 'cyan') {
  if (!r?.hasCondensation) return '';
  return mainResult('Kondensation', { label: 'Kondensationsleistung', value: fmt(r.condensateLs, 4), unit: 'l/s' }, [
    { label: 'Kondensat', value: fmt(r.condensateKgh, 2), unit: 'kg/h' },
    { label: 'Latente Leistung', value: fmt(r.condensationPowerKw, 2), unit: 'kW' },
    { label: 'Hinweis', value: '100%-Enthalpielinie überschritten', unit: '' }
  ], accent);
}

function wrgOutputCard(vm) {
  const r = vm.result;
  return card('WRG — Ausgabe', `<div class="wrg-group-grid wrg-group-grid--output">
    ${readonlyAirCard('Zuluft', r.supply, vm.accent, { includeMass: true })}
    ${readonlyAirCard('Fortluft', r.exhaust, vm.accent, { includeMass: true })}
  </div>`, vm.accent);
}

function mixingOutputCard(vm) {
  const r = vm.result;
  return card('Mischluft — Ausgabe', `<div class="wrg-group-grid wrg-group-grid--output">
    ${readonlyAirCard('Mischluft / Zuluft', r.mixed, vm.accent, { includeMass: false, includeVolume: true })}
    ${card('Mischungsverhältnis', inlineStats([
      { label: 'Außenluftanteil', value: fmt(r.outdoorShare, 0), unit: '%' },
      { label: 'Umluftanteil', value: fmt(r.recircShare, 0), unit: '%' },
      { label: 'Massenstrom', value: fmt(r.mixed?.massFlowKgh, 2), unit: 'kg/h' },
      { label: 'x', value: fmt(r.mixed?.humidityRatioGkg, 2), unit: 'g/kg' }
    ]), vm.accent)}
  </div>`, vm.accent);
}

export function renderWrgOutputs(vm) {
  const r = vm.result;
  return stack([
    wrgOutputCard(vm),
    mainResult('WRG-Leistung', { label: 'Rückgewonnene Leistung', value: fmt(r.recoveredPowerKw, 2), unit: 'kW' }, [
      { label: 'Wirkungsgrad', value: fmt(r.efficiency, 0), unit: '%' },
      { label: 'Bypass', value: fmt(r.bypassPercent, 0), unit: '%' },
      { label: 'WTX-Wirksam', value: fmt(r.effectiveVolumeFlowM3h, 0), unit: 'm³/h' },
      { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
    ], vm.accent),
    condensationCard(r, vm.accent)
  ].join(''));
}

export function renderMixingOutputs(vm) {
  return stack([mixingOutputCard(vm), condensationCard(vm.result, vm.accent)].join(''));
}

export function renderOutputs(vm){
  return vm.isMixing ? renderMixingOutputs(vm) : renderWrgOutputs(vm);
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
