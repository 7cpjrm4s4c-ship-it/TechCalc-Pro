import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const storage = fs.readFileSync(new URL('../js/core/projectStorage.js', import.meta.url), 'utf8');
const adapters = fs.readFileSync(new URL('../js/core/projectModuleStateAdapters.js', import.meta.url), 'utf8');

test('Phase 47C.3.1 persists module states through the central adapter registry', () => {
  assert.match(storage, /appendProjectModuleStates/);
  assert.match(storage, /applyProjectModuleStates/);
  assert.match(storage, /resetProjectModuleStates/);
  assert.doesNotMatch(storage, /floodingVerificationState/);
  assert.match(adapters, /flooding-verification/);
  assert.match(adapters, /floodingVerificationState\.replace/);
  assert.match(adapters, /floodingVerificationState\.reset/);
  assert.match(storage, /downloadProjectFile/);
});
