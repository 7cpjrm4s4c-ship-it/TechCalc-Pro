import { calculate } from './logic.js';
import { createHeatRecoveryViewModel } from './viewModel.js';
import { renderModeCard, renderInputs, renderOutputs, renderSavedRecords } from './view.js';
import { esc } from '../../core/renderer.js';
import { preserveFocusDuring } from '../../core/focusManager.js';

function setIslandInner(root, selector, html){
  const island = root?.querySelector?.(selector);
  if (!island) return false;
  const next = String(html ?? '');
  if (island.innerHTML !== next) preserveFocusDuring(root, () => { island.innerHTML = next; }, { skipSelect: true });
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

function syncFields(root, s = {}){
  updateSegment(root, 'mode', s.mode);
  [
    'activeRltDeviceName',
    'wrgVolumeFlowM3h',
    'outdoorTemp',
    'outdoorRh',
    'extractTemp',
    'extractRh',
    'efficiency',
    'bypassPercent',
    'mixingOutdoorVolumeFlowM3h',
    'mixingOutdoorTemp',
    'mixingOutdoorRh',
    'mixingRecircVolumeFlowM3h',
    'mixingRecircTemp',
    'mixingRecircRh'
  ].forEach(key => setInputValue(root, key, s[key] ?? ''));
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

export default updateHeatRecoveryDynamic;
