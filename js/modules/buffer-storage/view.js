import config from './config.js';
import { calculate } from './logic.js';
import { card, field, grid, inlineStats, renderModuleShell, segmented, selectField, stack } from '../../core/renderer.js';
import { createBufferStorageDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { createBufferStorageViewModel } from './viewModel.js';
import { bufferSaveCard } from './controller.js';

function renderFieldGrid(fields = [], modifier = '') {
  return `<div class="buffer-input-grid ${modifier}">${fields.map(item => field(item)).join('')}</div>`;
}

export function renderGlycolFields(vm) {
  const s = vm.state;
  if (s.mediumMode === 'water') return '';
  return grid([
    selectField({ id: 'glycolType', label: 'Glykolart', value: s.glycolType, options: vm.glycolTypeOptions }),
    selectField({ id: 'glycolConcentration', label: 'Konzentration', value: s.glycolConcentration, options: vm.glycolConcentrationOptions })
  ].join(''), 2);
}

export function renderMediumContent(vm) {
  const s = vm.state;
  return stack([
    selectField({ id: 'mediumMode', label: 'Wärmeträger', value: s.mediumMode, options: vm.mediumOptions }),
    renderGlycolFields(vm),
    inlineStats([{ label: 'Berechnungsfaktor', value: vm.factorLabel }, { label: 'Grundlage', value: 'Mitsubishi-Formel' }])
  ].join(''));
}

export function renderRuntimeInputs(vm) {
  return card('Mindestlaufzeit Verdichter', [
    renderFieldGrid(vm.runtimeFields, 'buffer-input-grid--runtime'),
    '<p class="tc-help ph-help ph-help--inline buffer-help"><strong>Teillast:</strong> prozentualer Leistungsanteil der kleinsten Verdichter-/Leistungsstufe. Beispiel: 4 gleich große Verdichter ⇒ 25 %. Die Berechnung nutzt intern 0,25.</p>',
    '<p class="tc-help ph-help ph-help--inline buffer-help"><strong>QLast:</strong> konstant durch aktive Verbraucher abgenommene Leistung. Falls keine konstante Last vorhanden oder bekannt ist, 0 kW eintragen.</p>'
  ].join(''), vm.accent);
}

export function renderDefrostInputs(vm) {
  return card('Abtaubetrieb Wärmepumpe', renderFieldGrid(vm.defrostFields, 'buffer-input-grid--defrost'), vm.accent);
}

export function renderReserveInputs(vm) {
  return card('Wasservorlage als Kälte- / Wärmespeicher', renderFieldGrid(vm.reserveFields, 'buffer-input-grid--reserve'), vm.accent);
}

export function renderInputBlocks(vm) {
  if (vm.isCompareMode) {
    return [
      renderRuntimeInputs(vm),
      renderDefrostInputs(vm),
      renderReserveInputs(vm)
    ].join('');
  }
  if (vm.isDefrostMode) return renderDefrostInputs(vm);
  if (vm.isReserveMode) return renderReserveInputs(vm);
  return renderRuntimeInputs(vm);
}

export function renderResultContent(vm) {
  return renderResultModel(vm.resultModel, vm.accent);
}

export function renderSavedRecords(vm) {
  return bufferSaveCard(vm.state);
}

export function renderView(s) {
  const vm = createBufferStorageViewModel(s);
  const inputColumn = stack([
    card('Berechnungsart', stack([
      `<div class="buffer-mode-tabs">${segmented('calculationMode', vm.bufferModeOptions, s.calculationMode, { accent: vm.accent })}</div>`,
      '<p class="tc-help ph-help">Die Auslegung kann die Mindestlaufzeit von Verdichtern, den Abtaubetrieb luftgekühlter Wärmepumpen oder eine definierte Kälte-/Wärmevorlage betrachten.</p>'
    ].join('')), vm.accent),
    card('Medium / Faktor', `<div data-buffer-dynamic="medium">${renderMediumContent(vm)}</div>`, vm.accent),
    `<div class="tc-stack" data-buffer-dynamic="input-blocks">${renderInputBlocks(vm)}</div>`,
    `<div data-buffer-dynamic="saved-records">${renderSavedRecords(vm)}</div>`
  ].join(''));

  const resultColumn = stack([
    `<div data-buffer-dynamic="result">${renderResultContent(vm)}</div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6">${resultColumn}</div>`);
}

const renderWithViewModel = renderer => (s, r) => renderer(createBufferStorageViewModel(s, r));

const bufferStorageDynamicRenderer = createBufferStorageDynamicRenderer({
  calculate,
  renderMedium: renderWithViewModel(renderMediumContent),
  renderInputBlocks: renderWithViewModel(renderInputBlocks),
  renderSavedPanel: renderWithViewModel(renderSavedRecords),
  renderResult: renderWithViewModel(renderResultContent)
});

export function updateBufferStorageDynamic(root, s, meta = {}) {
  bufferStorageDynamicRenderer.update(root, s, meta);
}

export function isDynamicBufferStorageAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}


export default renderView;
