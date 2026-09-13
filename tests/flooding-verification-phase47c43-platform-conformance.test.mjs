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

test('47C.4.3 consumes central domain tables instead of another module', () => {
  assert.match(controller, /core\/data\/rainwater/);
  assert.match(schema, /core\/data\/rainwater/);
  assert.match(logic, /core\/data\/rainwater/);
  assert.doesNotMatch(controller, /shared\/rainwaterDomainTables|shared\/rainwaterSurfaceSnapshot|modules\/rainwater|\.\.\/rainwater\/tables/);
  assert.doesNotMatch(schema, /shared\/rainwaterDomainTables|modules\/rainwater|\.\.\/rainwater\/tables/);
  assert.doesNotMatch(logic, /shared\/rainwaterDomainTables|modules\/rainwater|\.\.\/rainwater\/tables/);
  assert.match(rainwaterTables, /core\/data\/rainwater/);
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
