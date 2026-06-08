import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { toggleNumericSign } from '../../core/renderer.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { buildRltDeviceRecord, inferRltInputState, rltDeviceStats } from './results.js';

function normalizeRltSnapshot(snapshot = {}){
  const legacy = Array.isArray(snapshot.rltDevices) ? snapshot.rltDevices : [];
  const saved = Array.isArray(snapshot.savedRltDevices) && snapshot.savedRltDevices.length ? snapshot.savedRltDevices : legacy;
  return { ...snapshot, savedRltDevices: saved };
}

export function savedRltDevicePatch(item, currentState = {}){
  const normalized = normalizeRltSnapshot(currentState);
  return {
    ...inferRltInputState(item),
    savedRltDevices: normalized.savedRltDevices,
    activeRltDeviceId: item.id,
    activeRltDeviceName: item.name || '',
    expandedRltDeviceId: currentState.expandedRltDeviceId || null
  };
}

export const rltDeviceController = createLineSectionController({
  state,
  listKey: 'savedRltDevices',
  activeIdKey: 'activeRltDeviceId',
  nameKey: 'activeRltDeviceName',
  expandedIdKey: 'expandedRltDeviceId',
  recordPrefix: 'rlt',
  cardTitle: 'RLT-Geräte',
  nameLabel: 'Bezeichnung',
  nameInputId: 'activeRltDeviceName',
  namePlaceholder: 'z. B. RLT Büro EG',
  emptyText: 'Noch keine RLT-Geräte angelegt',
  accent: 'cyan',
  dynamicAttr: 'rlt-devices',
  dynamicDataAttr: 'data-wrg-dynamic',
  title: item => item?.name || 'RLT-Gerät',
  stats: rltDeviceStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildRltDeviceRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => savedRltDevicePatch(item, currentState)
});

export function rltDeviceCard(snapshot = {}){
  return rltDeviceController.renderCard(normalizeRltSnapshot(snapshot));
}

export function bindHeatRecoveryActions(root){
  const current = state.get();
  if ((!Array.isArray(current.savedRltDevices) || !current.savedRltDevices.length) && Array.isArray(current.rltDevices) && current.rltDevices.length) {
    state.set({ savedRltDevices: current.rltDevices }, { action: 'rlt:migrate-saved-records', notify: false });
  }

  root.querySelectorAll('[data-wrg-sign]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.wrgSign;
      const input = root.querySelector(`[data-field="${id}"]`);
      state.set({ [id]: toggleNumericSign(input?.value) }, { action: 'wrg:toggle-sign' });
    });
  });

  rltDeviceController.bind(root);
}
