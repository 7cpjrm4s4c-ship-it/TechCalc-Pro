import { calculate } from './logic.js';
import { createMixedAirViewModel } from './viewModel.js';
import { renderOutputs } from './view.js';
import { mixedAirController, mixedAirSaveCard } from './controller.js';
import { esc } from '../../core/renderer.js';

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

function syncFields(root, s = {}){
  [
    'mixingOutdoorVolumeFlowM3h',
    'mixingOutdoorTemp',
    'mixingOutdoorRh',
    'mixingRecircVolumeFlowM3h',
    'mixingRecircTemp',
    'mixingRecircRh',
    'activeMixedAirName'
  ].forEach(key => setInputValue(root, key, s[key] ?? ''));
}

export function updateMixedAirDynamic(root, s, meta = {}) {
  const vm = createMixedAirViewModel(s, calculate(s));
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  if (changed.some(key => key.startsWith('mixing'))) {
    setIslandInner(root, '[data-mixed-air-dynamic="formula"]', esc(vm.formula));
  }
  setIslandInner(root, '[data-mixed-air-dynamic="outputs"]', renderOutputs(vm));
  const savedChanged = changed.some(key => ['savedMixedAirStates','activeMixedAirId','activeMixedAirName','expandedMixedAirId'].includes(key));
  if (savedChanged) {
    mixedAirController.updateControls(root, s);
    if (!mixedAirController.updateRows(root, s)) {
      setIslandInner(root, '[data-mixed-air-dynamic="saved-panel"]', mixedAirSaveCard(s));
    }
  }
  syncFields(root, s);
}

export function isDynamicMixedAirAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default updateMixedAirDynamic;
