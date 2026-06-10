import { PROCESS_OPTIONS } from './logic.js';
import { createViewModel } from './viewModel.js';
import { renderHxResultModel } from './results.js';
import { chartCard } from './diagramRenderer.js';
import { hxProcessCard, hxProcessController } from './controller.js';
import { card, esc } from '../../core/renderer.js';
import { parseNumber } from '../../core/numberService.js';
import { preserveFocusDuring } from '../../core/focusManager.js';

export const HX_DYNAMIC = Object.freeze({
  results: 'results',
  diagram: 'diagram',
  savedProcesses: 'saved-processes',
  process: 'process'
});


function availableProcesses(s = {}) {
  const t0 = parseNumber(s.tempC, { fallback: 0 });
  const t1 = parseNumber(s.targetTempC, { fallback: 0 });
  if (t0 < t1) return PROCESS_OPTIONS.filter(option => !['cool', 'cool-dehumidify'].includes(option.value));
  if (t0 > t1) return PROCESS_OPTIONS.filter(option => ['cool', 'cool-dehumidify'].includes(option.value));
  return PROCESS_OPTIONS;
}

export function renderProcessSelection(snapshotOrVm = {}) {
  const s = snapshotOrVm?.state || snapshotOrVm || {};
  const options = availableProcesses(s);
  return card('Luftbehandlung wählen', `<div class="hx-process-grid">
    ${options.map(option => `<button type="button" data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === s.process ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
  </div>`, 'cyan', { compact: true });
}

export function createHxRenderModel(snapshot = {}) {
  return createViewModel(snapshot);
}

export function renderResults(snapshotOrVm = {}) {
  const vm = snapshotOrVm?.resultModel ? snapshotOrVm : createHxRenderModel(snapshotOrVm);
  return renderHxResultModel(vm);
}

export function renderDiagram(snapshotOrVm = {}) {
  const vm = snapshotOrVm?.activePath ? snapshotOrVm : createHxRenderModel(snapshotOrVm);
  return chartCard(vm.activePath, vm.targetReached);
}

export function renderSavedProcesses(snapshotOrVm = {}) {
  const state = snapshotOrVm?.state || snapshotOrVm || {};
  return hxProcessCard(state);
}

function setInner(root, selector, html) {
  const el = root?.querySelector?.(selector);
  if (!el) return false;
  const next = String(html ?? '');
  if (el.innerHTML !== next) preserveFocusDuring(root, () => { el.innerHTML = next; }, { skipSelect: true });
  return true;
}

export function syncSavedProcessControls(root, snapshot = {}) {
  hxProcessController?.updateControls?.(root, snapshot);
}

export function renderDynamicSections(root, snapshot = {}, meta = {}) {
  if (!root) return true;
  const vm = createHxRenderModel(snapshot);
  const action = String(meta?.action || '');
  const changed = Array.isArray(meta?.changed) ? meta.changed : [];
  const savedStructural = /^(line:|saved:|hx:line:)/.test(action)
    || changed.some(key => ['savedProcesses', 'processes', 'activeProcessId', 'expandedProcessId', 'label'].includes(key));

  setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.process}"]`, renderProcessSelection(vm));
  setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.results}"]`, renderResults(vm));
  setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.diagram}"]`, renderDiagram(vm));

  if (savedStructural) {
    setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"]`, renderSavedProcesses(vm));
  }
  syncSavedProcessControls(root, snapshot);
  root.__tcHxRenderPipeline = { action, changed, at: Date.now() };
  return true;
}
