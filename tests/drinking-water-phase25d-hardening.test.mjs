import assert from 'node:assert/strict';
import fs from 'node:fs';

const moduleDir = new URL('../js/modules/drinking-water/', import.meta.url);
const coreDir = new URL('../js/core/', import.meta.url);
const readModule = name => fs.readFileSync(new URL(name, moduleDir), 'utf8');
const readCore = name => fs.readFileSync(new URL(name, coreDir), 'utf8');

const index = readModule('index.js');
const config = readModule('config.js');
const controller = readModule('controller.js');
const dynamicRenderer = readModule('dynamicRenderer.js');
const logic = readModule('logic.js');
const results = readModule('results.js');
const view = readModule('view.js');
const projectStorage = readCore('projectStorage.js');

assert.match(config, /phase-25d-hardening/, 'config migration status must include phase 25D');
assert.match(index, /createPlatformModule/);
assert.doesNotMatch(index, /mountModule|renderModuleShell|safeReplaceContent|mainResult|resultCard/);

assert.match(controller, /__tcDrinkingWaterActionsBound/, 'controller binding must be idempotent across dynamic/full remounts');
assert.match(controller, /preserveScrollPosition/, 'controller must preserve scroll for manual refreshes');
assert.doesNotMatch(controller, /safeReplaceContent\(root,/, 'controller must not replace the full module root');

assert.match(dynamicRenderer, /preserveScroll/, 'dynamic renderer must preserve viewport during island refreshes');
assert.match(dynamicRenderer, /updateDrinkingWaterDynamicUnsafe/, 'dynamic renderer should wrap island replacement in a hardened scroll guard');
assert.doesNotMatch(dynamicRenderer, /root\.innerHTML\s*=/, 'dynamic renderer must not replace the full module root');

assert.match(logic, /Berechnet wird ausschließlich aus persistent gespeicherten/, 'logic must document stored-record-only result contract');
assert.doesNotMatch(logic, /draftUsageUnitFromState\(s\)|draftSingleGroupFromState\(s\)/, 'calculation must not include draft state in the result');
assert.match(results, /hasStoredConsumers/, 'result model must keep empty startup cards blank');
assert.match(view, /dw-save-dialog__summary/, 'save dialog must keep two-line heading/subheading spacing contract');

assert.match(projectStorage, /normalizeDrinkingWaterProjectModule/, 'project storage must normalize legacy drinking-water saved records');
assert.match(projectStorage, /savedUsageUnits: usageUnits/);
assert.match(projectStorage, /savedSingleConsumers: singleConsumers/);

console.log('drinking-water phase25d hardening ok');
