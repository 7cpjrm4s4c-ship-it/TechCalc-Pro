import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFloodingInterpretationModel } from '../js/modules/flooding-verification/interpretationModel.js';
import results from '../js/modules/flooding-verification/results.js';

const applicable = { status: 'applicable' };

test('DIN-governing case produces planning-ready summary', () => {
  const model = buildFloodingInterpretationModel({
    result: {
      combinedStorage: { status: 'complete', governingSource: 'din', planningVolumeM3: 143.23, dinVolumeM3: 143.23, dwaVolumeM3: 16.59 },
      flooding: { governing: { source: 'equation-21' } },
      retention: { active: true, calculated: true },
      dischargeAdequate: false,
      dischargeMode: 'authority-discharge-limit',
      requiredRainFlowLs: 47.69,
      availableFlowLs: 5
    },
    applicability: applicable
  });
  assert.match(model.summary, /143,23 m³/);
  assert.match(model.summary, /DIN 1986-100 \(Gleichung \(21\)\)/);
  assert.match(model.discharge, /Einleitungsbegrenzung/);
  assert.match(model.normative, /größere erforderliche Volumenbedarf/);
});

test('DWA-governing case is identified explicitly', () => {
  const model = buildFloodingInterpretationModel({
    result: {
      combinedStorage: { status: 'complete', governingSource: 'dwa', planningVolumeM3: 80, dinVolumeM3: 50, dwaVolumeM3: 80 },
      flooding: {},
      retention: { active: true, calculated: true },
      dischargeAdequate: true,
      requiredRainFlowLs: 10,
      availableFlowLs: 12
    },
    applicability: applicable
  });
  assert.match(model.summary, /Maßgebend ist der Rückhalteraumnachweis/);
  assert.match(model.discharge, /vollständig ab/);
});

test('DWA applicability states produce professional interpretation', () => {
  const result = { combinedStorage: { status: 'complete' }, retention: { active: true, calculated: false } };
  assert.match(buildFloodingInterpretationModel({ result, applicability: { status: 'preliminary-only' } }).dwa, /Vorbemessung/);
  assert.match(buildFloodingInterpretationModel({ result, applicability: { status: 'long-term-simulation-required' } }).dwa, /Langzeitsimulation/);
});

test('incomplete evidence produces completion recommendation', () => {
  const model = buildFloodingInterpretationModel({
    result: { combinedStorage: { status: 'pending-dwa' }, retention: { active: true } },
    applicability: { status: 'incomplete' }
  });
  assert.match(model.summary, /vorläufig|Vervollständigung/);
  assert.match(model.recommendation, /vervollständigen/);
});

test('result model renders interpretation before technical details', () => {
  const model = results({}, {
    combinedStorage: { status: 'din-only', governingSource: 'din', planningVolumeM3: 10, dinVolumeM3: 10 },
    flooding: { equation20: {}, equation21ByDuration: [], equation21Governing: {}, governing: {} },
    retention: { active: false, durationResults: [] },
    warnings: [],
    totalArea: 100,
    criticalShare: 0.2
  });
  assert.equal(model.groups[0].title, 'Planerische Interpretation');
  assert.deepEqual(model.groups[0].rows.map(row => row.label), [
    'Planerische Zusammenfassung',
    'Leitungsnachweis',
    'DWA-A 117',
    'Normative Aussage',
    'Handlungsempfehlung'
  ]);
  assert.ok(model.interpretation.summary);
});
