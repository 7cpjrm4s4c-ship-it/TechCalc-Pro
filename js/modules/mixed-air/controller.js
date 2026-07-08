import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { toggleNumericSign } from '../../core/renderer.js';
import { fmt } from '../../utils/calculations.js';
import { state } from './state.js';
import { calculate } from './logic.js';

const MIXED_AIR_INPUT_FIELDS = [
  'mixingOutdoorVolumeFlowM3h',
  'mixingOutdoorTemp',
  'mixingOutdoorRh',
  'mixingRecircVolumeFlowM3h',
  'mixingRecircTemp',
  'mixingRecircRh'
];

function pickMixedAirInputState(source = {}) {
  return MIXED_AIR_INPUT_FIELDS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) acc[key] = source[key];
    return acc;
  }, {});
}

function normalizeSavedMixedAirSnapshot(snapshot = {}) {
  return {
    ...snapshot,
    savedMixedAirStates: Array.isArray(snapshot.savedMixedAirStates) ? snapshot.savedMixedAirStates : []
  };
}

export function buildMixedAirRecord(currentState = {}, result = {}, items = [], id, name, existing = null) {
  const inputState = pickMixedAirInputState(currentState);
  return {
    id,
    name: name || currentState.activeMixedAirName || existing?.name || `Mischluft ${items.length + 1}`,
    mode: 'Mischluft',
    outdoor: `${fmt(currentState.mixingOutdoorTemp, 2)} °C / ${fmt(currentState.mixingOutdoorRh, 0)} %`,
    recirc: `${fmt(currentState.mixingRecircTemp, 2)} °C / ${fmt(currentState.mixingRecircRh, 0)} %`,
    mixed: `${fmt(result?.mixed?.tempC, 2)} °C / ${fmt(result?.mixed?.rhPercent, 0)} %`,
    volumeFlowM3h: fmt(result?.mixed?.volumeFlowM3h, 0),
    state: inputState,
    inputState,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function mixedAirStats(item = {}) {
  return [
    { label: 'Berechnung', value: item.mode || 'Mischluft' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Außenluft', value: item.outdoor || '—' },
    { label: 'Umluft', value: item.recirc || '—' },
    { label: 'Mischluft', value: item.mixed || '—' }
  ];
}

export function hydrateMixedAirRecord(item = {}, currentState = {}) {
  const inputState = pickMixedAirInputState(item.inputState || item.state || item);
  return {
    ...inputState,
    savedMixedAirStates: Array.isArray(currentState.savedMixedAirStates) ? currentState.savedMixedAirStates : [],
    activeMixedAirId: item.id || null,
    activeMixedAirName: item.name || '',
    expandedMixedAirId: currentState.expandedMixedAirId || null
  };
}

export const mixedAirController = createLineSectionController({
  state,
  listKey: 'savedMixedAirStates',
  activeIdKey: 'activeMixedAirId',
  nameKey: 'activeMixedAirName',
  expandedIdKey: 'expandedMixedAirId',
  recordPrefix: 'mixed-air',
  cardTitle: 'Mischluft speichern',
  nameLabel: 'Bezeichnung',
  nameInputId: 'activeMixedAirName',
  namePlaceholder: 'z. B. Mischluft Büro EG',
  emptyText: 'Noch keine Mischluftzustände gespeichert.',
  accent: 'cyan',
  dynamicAttr: 'saved-mixed-air',
  dynamicDataAttr: 'data-mixed-air-dynamic',
  title: item => item?.name || 'Mischluft',
  stats: mixedAirStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildMixedAirRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrateMixedAirRecord(item, currentState)
});

export function mixedAirSaveCard(snapshot = {}) {
  return mixedAirController.renderCard(normalizeSavedMixedAirSnapshot(snapshot));
}

function bindMixedAirSignDelegation(root) {
  if (!root || root.__tcMixedAirSignBound) return;
  root.__tcMixedAirSignBound = true;
  root.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-mixed-air-sign]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    const id = button.dataset.mixedAirSign;
    const input = root.querySelector(`[data-field="${id}"]`);
    state.set({ [id]: toggleNumericSign(input?.value) }, { action: 'mixed-air:toggle-sign' });
  });
}

export function bindMixedAirActions(root) {
  bindMixedAirSignDelegation(root);
  mixedAirController.bind(root);
}
