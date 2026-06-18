import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderInputCard, renderResultCard } from './view.js';
import { preserveScroll } from '../../core/scrollManager.js';
import { preserveFocusDuring } from '../../core/focusManager.js';

function isDetachedNodeRace(error) {
  return error?.name === 'NotFoundError' || /no longer a child/i.test(String(error?.message || ''));
}

function setIslandInner(root, selector, html){
  const island = root?.querySelector?.(selector);
  if (!island || island.isConnected === false || root?.isConnected === false) return false;
  const next = String(html ?? '');
  if (island.innerHTML === next) return true;
  const apply = () => {
    if (!island.isConnected || (root?.contains && !root.contains(island))) return false;
    try {
      island.innerHTML = next;
      return true;
    } catch (error) {
      if (!isDetachedNodeRace(error)) throw error;
      return false;
    }
  };
  preserveFocusDuring(root, apply, { skipSelect: true });
  return true;
}

function setInputValue(root, fieldName, value){
  const el = root?.querySelector?.(`[data-field="${fieldName}"]`);
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

function syncFields(root, s = {}){
  updateSegment(root, 'waterHeatingMode', s.waterHeatingMode);
  updateSegment(root, 'singlePermanent', String(s.singlePermanent));
  [
    'buildingType',
    'unitName',
    'unitConsumerType',
    'unitCount',
    'unitSimultaneityFactor',
    'singleName',
    'singleConsumerType',
    'singleCount'
  ].forEach(key => setInputValue(root, key, s[key] ?? ''));
}

function hasAnyChanged(changed = [], keys = []){
  return changed.some(key => keys.includes(key));
}

const INPUT_KEYS = [
  'buildingType',
  'waterHeatingMode',
  'unitName',
  'unitConsumerType',
  'unitCount',
  'unitSimultaneityFactor',
  'unitDraftConsumers',
  'singleName',
  'singleConsumerType',
  'singleCount',
  'singlePermanent',
  'singleDraftConsumers',
  'savedUsageUnits',
  'savedSingleConsumers',
  'activeUnitId',
  'activeSingleId',
  'expandedUnitId',
  'expandedSingleId',
  'uiUnitFormOpen',
  'uiUnitSavedOpen',
  'uiSingleFormOpen',
  'uiSingleSavedOpen'
];

const RESULT_KEYS = [
  'buildingType',
  'waterHeatingMode',
  'savedUsageUnits',
  'savedSingleConsumers'
];

export function updateDrinkingWaterDynamic(root, s, meta = {}){
  return preserveScroll(() => updateDrinkingWaterDynamicUnsafe(root, s, meta), 'savedRecord');
}

function updateDrinkingWaterDynamicUnsafe(root, s, meta = {}){

  console.debug(
  '[DW_DYNAMIC_DETAIL]',
  {
    action: meta?.action || 'unknown',
    changed: meta?.changed || [],
    ts: performance.now()
  }
);

  const vm = createDrinkingWaterViewModel(s);
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  const action = String(meta.action || '');
  
  if (action === 'surface:confirm' && 
  changed.length === 0) {
    return;
  }; 
  const initial = !root.__tcDrinkingWaterDynamic;
  const inputAction = /^(dw:|line:|saved:)/.test(action);

let __tcDwActiveTouch = window.__tcDwActiveTouch || false;
if (typeof window !== 'undefined' && !window.__tcDwTouchGuardInstalled) {
  window.__tcDwTouchGuardInstalled = true;
  window.addEventListener('touchstart', () => { window.__tcDwActiveTouch = true; }, { passive:true });
  const release=()=>{ window.__tcDwActiveTouch = false; };
  window.addEventListener('touchend', release, { passive:true });
  window.addEventListener('touchcancel', release, { passive:true });
}

  if (initial || inputAction || !changed.length || hasAnyChanged(changed, INPUT_KEYS)) {
    setIslandInner(root, '[data-dw-dynamic="input"]', renderInputCard(vm));
  }
  const shouldRenderResult = initial || !changed.length || hasAnyChanged(changed, RESULT_KEYS);
  if (shouldRenderResult && !window.__tcDwActiveTouch) {
    setIslandInner(root, '[data-dw-dynamic="result"]', renderResultCard(vm));
  }

  syncFields(root, s);
  root.__tcDrinkingWaterDynamic = {
    at: Date.now(),
    activeUnitId: s.activeUnitId || null,
    activeSingleId: s.activeSingleId || null,
    expandedUnitId: s.expandedUnitId || null,
    expandedSingleId: s.expandedSingleId || null
  };
}

export function isDynamicDrinkingWaterAction(meta = {}){
  return String(meta.action || '') !== 'initial';
}

export default updateDrinkingWaterDynamic;
