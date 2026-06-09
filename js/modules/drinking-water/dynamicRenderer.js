import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderInputCard, renderResultCard } from './view.js';

function setIslandInner(root, selector, html){
  const island = root?.querySelector?.(selector);
  if (!island) return false;
  const next = String(html ?? '');
  if (island.innerHTML !== next) island.innerHTML = next;
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
  const vm = createDrinkingWaterViewModel(s);
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  const action = String(meta.action || '');
  const initial = !root.__tcDrinkingWaterDynamic;
  const inputAction = /^(dw:|line:|saved:)/.test(action);

  if (initial || inputAction || !changed.length || hasAnyChanged(changed, INPUT_KEYS)) {
    setIslandInner(root, '[data-dw-dynamic="input"]', renderInputCard(vm));
  }
  if (initial || inputAction || !changed.length || hasAnyChanged(changed, RESULT_KEYS)) {
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
