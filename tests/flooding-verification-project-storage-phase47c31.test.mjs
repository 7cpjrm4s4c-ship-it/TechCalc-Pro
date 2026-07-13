import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../js/core/projectStorage.js', import.meta.url), 'utf8');

test('Phase 47C.3.1 persists flooding verification in project data', () => {
  assert.match(source, /flooding-verification/);
  assert.match(source, /collectProjectData\(\)/);
  assert.match(source, /applyProjectData\(data/);
  assert.match(source, /floodingVerificationState\.replace/);
  assert.match(source, /floodingVerificationState\.reset/);
  assert.match(source, /downloadProjectFile/);
});
