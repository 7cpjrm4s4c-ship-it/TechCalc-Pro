import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const controller = read('js/modules/flooding-verification/controller.js');
const index = read('js/modules/flooding-verification/index.js');
const schema = read('js/modules/flooding-verification/schema.js');
const logic = read('js/modules/flooding-verification/logic.js');
const projectStorage = read('js/core/projectStorage.js');
const projectAdapters = read('js/core/projectModuleStateAdapters.js');
const rainwaterTables = read('js/modules/rainwater/tables.js');

test('47C.4.3 has no module-local event or debounce path', () => {
  assert.doesNotMatch(index, /addEventListener/);
  assert.doesNotMatch(controller, /ADD_DEBOUNCE|lastSurfaceAdd|shouldAcceptSurfaceAdd/);
  assert.doesNotMatch(controller, /addEventListener/);
});

test('47C.4.3 consumes shared domain tables instead of another module', () => {
  assert.match(schema, /shared\/rainwaterDomainTables/);
  assert.match(logic, /shared\/rainwaterDomainTables/);
  assert.doesNotMatch(schema, /modules\/rainwater|\.\.\/rainwater\/tables/);
  assert.doesNotMatch(logic, /modules\/rainwater|\.\.\/rainwater\/tables/);
  assert.match(rainwaterTables, /shared\/rainwaterDomainTables/);
});

test('47C.4.3 routes surface editing through the central line-section controller', () => {
  assert.match(index, /createLineSectionController/);
  assert.match(index, /listKey: 'surfaces'/);
  assert.match(index, /hydrateRecord: args => hydrateFloodingSurfaceRecord\(args\)/);
  assert.match(controller, /lineSectionController\?\.bind\?\.\(root\)/);
  assert.doesNotMatch(controller, /surfacesEdit|saveSurface|editSurface/);
});

test('47C.4.3 keeps project storage generic', () => {
  assert.match(projectStorage, /projectModuleStateAdapters/);
  assert.doesNotMatch(projectStorage, /floodingVerificationState/);
  assert.match(projectAdapters, /flooding-verification/);
});
