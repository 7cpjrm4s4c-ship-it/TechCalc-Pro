import assert from 'node:assert/strict';

const stored = new Map([['techcalc-preferences', JSON.stringify({ mobileQuickAccess: ['ventilation', 'heating-cooling', 'pipe-sizing', 'unit-converter'] })]]);
globalThis.localStorage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value)
};

const { loadPreferences, setModuleOrder, setMobileQuickAccess } = await import('../core/ux/preferences.js');
const { orderedModuleIds } = await import('../core/navigation/index.js');
const available = ['heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter', 'mixed-air', 'heat-recovery'].map(id => ({ id }));

assert.deepEqual(orderedModuleIds(loadPreferences(), available), [
  'ventilation', 'heating-cooling', 'pipe-sizing', 'unit-converter', 'mixed-air', 'heat-recovery'
], 'existing four quick accesses migrate to the front of the complete list');

setModuleOrder(['heat-recovery', 'mixed-air', 'ventilation', 'heating-cooling', 'pipe-sizing', 'unit-converter']);
assert.deepEqual(loadPreferences().mobileQuickAccess, ['heat-recovery', 'mixed-air', 'ventilation', 'heating-cooling']);
assert.deepEqual(orderedModuleIds(loadPreferences(), available), [
  'heat-recovery', 'mixed-air', 'ventilation', 'heating-cooling', 'pipe-sizing', 'unit-converter'
]);

const snapshot = loadPreferences();
snapshot.moduleOrder.reverse();
assert.equal(loadPreferences().moduleOrder[0], 'heat-recovery', 'consumer changes cannot mutate stored order');
assert.deepEqual(JSON.parse(stored.get('techcalc-preferences')).moduleOrder, loadPreferences().moduleOrder);

setMobileQuickAccess(['unit-converter', 'heat-recovery', 'mixed-air', 'ventilation']);
assert.deepEqual(orderedModuleIds(loadPreferences(), available), [
  'unit-converter', 'heat-recovery', 'mixed-air', 'ventilation', 'heating-cooling', 'pipe-sizing'
], 'existing quick access API retains the order of remaining modules');
setModuleOrder(['mixed-air', 'mixed-air', null, 'unknown']);
assert.deepEqual(orderedModuleIds(loadPreferences(), available), [
  'mixed-air', 'heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter', 'heat-recovery'
], 'duplicate and unavailable module IDs do not disturb the navigation');
console.log('Full module order and legacy preferences passed.');
