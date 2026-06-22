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

function captureHxScroll(root) {
  const scroller = root?.closest?.('.app-main, .main, main, .module-scroll, .module-view') || document.scrollingElement || document.documentElement;
  return {
    scroller,
    top: scroller?.scrollTop ?? 0,
    left: scroller?.scrollLeft ?? 0,
    winX: window.scrollX || 0,
    winY: window.scrollY || 0
  };
}

function restoreHxScroll(snapshot) {
  if (!snapshot) return;
  const apply = () => {
    try {
      if (snapshot.scroller) {
        snapshot.scroller.scrollTop = snapshot.top;
        snapshot.scroller.scrollLeft = snapshot.left;
      }
      window.scrollTo(snapshot.winX, snapshot.winY);
    } catch { /* scroll restore only */ }
  };
  apply();
  requestAnimationFrame(apply);
  setTimeout(apply, 40);
  setTimeout(apply, 120);
  setTimeout(apply, 260);
}

function withHxScrollFreeze(root, enabled, mutation) {
  if (!enabled) return mutation();
  const snapshot = captureHxScroll(root);
  const result = mutation();
  restoreHxScroll(snapshot);
  return result;
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
    return withHxScrollFreeze(root, true, () => {
      syncSavedProcessControls(root, snapshot);

      const rowsHost = root.querySelector?.(`[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"] [data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"]`);
      if (rowsHost) {
        const nextRows = hxProcessController.renderRows(snapshot);
        if (rowsHost.innerHTML !== nextRows) preserveFocusDuring(root, () => { rowsHost.innerHTML = nextRows; }, { skipSelect: true });
      } else {
        const vm = createHxRenderModel(snapshot);
        setInner(root, `[data-hx-dynamic="${HX_DYNAMIC.savedProcesses}"]`, renderSavedProcesses(vm));
      }

      return updateAllLiveIslands();
    });
  }

  return updateAllLiveIslands();
}

