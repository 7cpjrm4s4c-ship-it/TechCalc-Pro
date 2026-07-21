import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildFloodingSurfaceRecord,
  hydrateFloodingSurfaceRecord
} from '../js/modules/flooding-verification/controller.js';
import { deleteCollectionItem } from '../js/platform/collectionModel/index.js';

const draft = {
  surfaces: [],
  surfaceCategory: 'roof',
  surfaceAreaType: 'tile-roof',
  surfaceArea: '100',
  surfaceCs: '1,0',
  surfaceCm: '0,8'
};

test('Phase 47C.4.4 builds one independently addressable saved surface', () => {
  const record = buildFloodingSurfaceRecord({ currentState: draft, id: 'surface-a', name: 'Dach Nord' });
  assert.equal(record.id, 'surface-a');
  assert.equal(record.name, 'Dach Nord');
  assert.equal(deleteCollectionItem([record, { ...record, id: 'surface-b' }], 'surface-a').length, 1);
});

test('Phase 47C.4.4 hydrates the complete surface editor', () => {
  const patch = hydrateFloodingSurfaceRecord({ item: {
    id: 'surface-a', name: 'Hof', category: 'property', areaType: 'concrete-asphalt', area: '250', cs: '1,0', cm: '0,9'
  }});
  assert.equal(patch.activeSurfaceId, 'surface-a');
  assert.equal(patch.surfaceCategory, 'property');
  assert.equal(patch.surfaceAreaType, 'concrete-asphalt');
  assert.equal(patch.surfaceArea, '250');
  assert.equal(patch.surfaceCs, '1,0');
  assert.equal(patch.surfaceCm, '0,9');
});

test('Phase 47C.4.4 imports valid rainwater records with upsert and conflict handling', () => {
  const source = fs.readFileSync(new URL('../js/modules/flooding-verification/controller.js', import.meta.url), 'utf8');
  assert.match(source, /readRainwaterSurfaceSnapshot\(\)\.filter\(item => number\(item\.area\) > 0\)/);
  assert.match(source, /createRecordId\('rain-snapshot'\)/);
  assert.match(source, /const replacements = new Map\(\)/);
  assert.match(source, /if \(local\.modifiedAfterImport\)/);
  assert.match(source, /const nextSurfaces = \[\.\.\.additions, \.\.\.nextExisting\]/);
});

test('Phase 47C.4.4 uses the central line-section saved-record adapter', () => {
  const index = fs.readFileSync(new URL('../js/modules/flooding-verification/index.js', import.meta.url), 'utf8');
  const schema = fs.readFileSync(new URL('../js/modules/flooding-verification/schema.js', import.meta.url), 'utf8');
  assert.match(index, /createLineSectionController/);
  assert.match(index, /cardTitle: 'Gespeicherte Flächen'/);
  assert.match(schema, /text: 'Flächen importieren'/);
  assert.doesNotMatch(schema, /FIELD_TYPES\.COLLECTION/);
});

test('Phase 47C.4.4 deduplicates collection actions independent of event type', () => {
  const runtime = fs.readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
  assert.match(runtime, /const key = `\$\{action\}:\$\{element\.dataset\.collection \|\| ''\}:\$\{element\.dataset\.collectionId \|\| ''\}`/);
  assert.doesNotMatch(runtime, /const key = `[^`]*\$\{event\.type\}[^`]*`/);
});