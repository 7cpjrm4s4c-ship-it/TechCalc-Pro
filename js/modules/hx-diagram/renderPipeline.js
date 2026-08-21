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
    ${options.map(option => `<button type="button" data-platform-focus data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === s.process ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
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
  return chartCard(vm.activePath, vm.targetReached, vm.result?.processIssue);
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

function withHxScrollFreeze(root, enabled, mutation) {
  // Dev.33: local h,x scroll freezing caused delayed snap-backs.
  // Structural scroll stability is owned centrally by scrollManager/renderCoordinator.
  return mutation();
}

function syncHxFormFields(root, snapshot = {}) {
  if (!root?.querySelector) return;
  const fields = ['tempC', 'rhPercent', 'targetTempC', 'targetRhPercent'];
  fields.forEach(field => {
    const el = root.querySelector(`[data-field="${field}"]`);
    if (!el || document.activeElement === el) return;
    const next = String(snapshot?.[field] ?? '');
    if (el.value !== next) el.value = next;
  });
  const nameEl = root.querySelector('#hxProcessName');
  if (nameEl && document.activeElement !== nameEl) {
    const nextName = String(snapshot?.label ?? '');
    if (nameEl.value !== nextName) nameEl.value = nextName;
  }
}

export function syncSavedProcessControls(root, snapshot = {}) {
  hxProcessController?.updateControls?.(root, snapshot);
}

export function renderDynamicSections(root, snapshot = {}, meta = {}) {
  if (!root) return true;
  const action = String(meta?.action || '');
  const changed = Array.isArray(meta?.changed) ? meta.changed : [];
  const savedStructural = /^(line:|saved:|hx:line:)/.test(action)
    || changed.some(key => ['savedProcesses', 'processes', 'activeProcessId', 'expandedProcessId', 'label'].includes(key));

  const updateAllLiveIslands = () => {
    syncHxFormFields(root, snapshot);
    const vm = createHxRenderModel(snapshot);
    setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.process}"]`, renderProcessSelection(vm));
    setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.results}"]`, renderResults(vm));
    setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.diagram}"]`, renderDiagram(vm));
    syncSavedProcessControls(root, snapshot);
    return true;
  };

  if (savedStructural) {
    // Phase 42C: h,x saved selection is not rows-only. The selected process must
    // hydrate inputs and refresh process/results/diagram outlets. The legacy
    // scroll-freeze chain remains removed; stability is achieved by named outlet
    // diffing via setInner and by updating rows without replacing the full module.
    return withHxScrollFreeze(root, true, () => {
      syncHxFormFields(root, snapshot);
      const vm = createHxRenderModel(snapshot);
      setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.process}"]`, renderProcessSelection(vm));
      setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.results}"]`, renderResults(vm));
      setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.diagram}"]`, renderDiagram(vm));
      syncSavedProcessControls(root, snapshot);

      const rowsHost = root.querySelector?.(`[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"] .saved-record-list`)
        || root.querySelector?.(`[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"] .empty-state`);
      const nextRows = hxProcessController.renderRows(snapshot);
      if (rowsHost) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = nextRows;
        const nextNode = wrapper.firstElementChild;
        if (nextNode && rowsHost.outerHTML !== nextNode.outerHTML) rowsHost.replaceWith(nextNode);
      } else {
        const host = root.querySelector?.(`[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"]`);
        const next = renderSavedProcesses(vm);
        if (host && host.innerHTML !== next) host.innerHTML = next;
      }

      return true;
    });
  }

  return updateAllLiveIslands();
}
