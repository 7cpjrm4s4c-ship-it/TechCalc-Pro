import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPressureHoldingResultModel } from '../js/modules/pressure-holding/results.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexSource = fs.readFileSync(path.join(root, 'js/modules/pressure-holding/index.js'), 'utf8');
const resultsSource = fs.readFileSync(path.join(root, 'js/modules/pressure-holding/results.js'), 'utf8');

assert.match(indexSource, /renderResultModel/);
assert.match(indexSource, /buildPressureHoldingResultModel/);
assert.doesNotMatch(indexSource, /\bmainResult\b/);
assert.doesNotMatch(indexSource, /\bresultCard\b/);
assert.doesNotMatch(indexSource, /\bresultRows\b/);
assert.match(resultsSource, /pressureHoldingPrimary/);
assert.match(resultsSource, /pressureHoldingIntermediateRows/);

const magModel = buildPressureHoldingResultModel({ holdingType: 'mag', includeServitec: 'true', connectionType: 'suction' }, {
  vnMag: 123.45,
  productLabel: 'Reflex N 140',
  selectedVolume: 123.45,
  selectedStandardVolume: 140,
  p0: 1.2,
  paMin: 1.5,
  pe: 2.5,
  expansionPct: 2.88,
  vaporPressure: 0,
  staticPressure: 1,
  ve: 28.8,
  vv: 5,
  asv: 0.5,
  factor: 2.1,
  warnings: []
}, 'purple');

assert.equal(magModel.primary.title, 'Ergebnis Druckhaltung');
assert.equal(magModel.primary.primary.label, 'Erforderliches MAG-Nennvolumen');
assert.equal(magModel.groups.length, 2);
assert.equal(magModel.groups[0].title, 'Zwischenergebnisse');
assert.equal(magModel.notices[0].title, 'Plausibilität');

const dynamicModel = buildPressureHoldingResultModel({ holdingType: 'dynamic', dynamicType: 'variomat', connectionType: 'pressure' }, {
  vnDynamic: 88.8,
  productLabel: 'Variomat, VG Grundgefäß 100 l',
  selectedVolume: 88.8,
  selectedStandardVolume: 100,
  p0: 1.4,
  paMin: 1.7,
  pe: 2.5,
  warnings: ['Enddruck prüfen.']
}, 'purple');

assert.equal(dynamicModel.primary.primary.label, 'Erforderliches Nennvolumen Variomat');
assert.equal(dynamicModel.notices[0].messages[0], 'Enddruck prüfen.');

console.log('pressure-holding-phase20b3-result-renderer ok');
