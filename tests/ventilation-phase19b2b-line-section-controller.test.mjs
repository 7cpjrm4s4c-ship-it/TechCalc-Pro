import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controllerSource = readFileSync(new URL('../js/modules/ventilation/controller.js', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../js/modules/ventilation/view.js', import.meta.url), 'utf8');
const source = `${controllerSource}\n${viewSource}`;
const stateSource = readFileSync(new URL('../js/modules/ventilation/state.js', import.meta.url), 'utf8');

assert.match(source, /createLineSectionController\(\{/, 'ventilation uses shared line-section controller');
assert.match(source, /listKey:\s*'ventLineSections'/, 'ventilation line sections are state-backed');
assert.match(source, /activeIdKey:\s*'activeVentLineSectionId'/, 'active ventilation record id uses platform controller');
assert.match(source, /nameInputId:\s*'ventLineSectionName'/, 'ventilation keeps existing name input id');
assert.match(source, /hydrateRecord:\s*\(\{ item, currentState \}\) => savedVentilationPatch\(item, currentState\)/, 'existing hydrator is wired to platform controller');
assert.match(source, /ventilationLineSectionController\.bind\(root\)/, 'binding is delegated to platform controller');
assert.match(source, /ventilationLineSectionController\.renderCard\(s\)/, 'card rendering is delegated to platform controller');
assert.match(source, /ventilationLineSectionController\.updateControls\(root, s\)/, 'control updates are delegated to platform controller');
assert.match(source, /ventilationLineSectionController\.renderRows\(s\)/, 'row rendering is delegated to platform controller');

assert.doesNotMatch(source, /function bindVentilationLineSections/, 'legacy ventilation saved-record binder removed');
assert.doesNotMatch(source, /function saveCurrentLine/, 'legacy save handler removed');
assert.doesNotMatch(source, /function updateCurrentLine/, 'legacy update handler removed');
assert.doesNotMatch(source, /function loadLine/, 'legacy load handler removed');
assert.doesNotMatch(source, /function deleteLine/, 'legacy delete handler removed');
assert.doesNotMatch(source, /function toggleLine/, 'legacy toggle handler removed');
assert.doesNotMatch(source, /let ventilationLineSectionsMemory/, 'module-local saved memory removed');
assert.doesNotMatch(source, /data-vent-line-save/, 'module-specific save attribute removed');
assert.doesNotMatch(source, /data-vent-line-update/, 'module-specific update attribute removed');
assert.doesNotMatch(source, /vent-line:save/, 'module-specific save action removed');
assert.doesNotMatch(source, /vent-line:update/, 'module-specific update action removed');

assert.match(stateSource, /ventLineSections:\s*\[\]/, 'vent line sections exist in module state');
assert.match(stateSource, /activeVentLineSectionId:\s*null/, 'active vent line id exists in module state');
assert.match(stateSource, /expandedVentLineSectionId:\s*null/, 'expanded vent line id exists in module state');

console.log('ventilation phase19b2b line-section controller regression ok');
