import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import moduleDefinition from '../js/modules/en-378-safety-check/index.js';
import schema from '../js/modules/en-378-safety-check/schema.js';
import { initialState } from '../js/modules/en-378-safety-check/state.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import { buildEN378ReportSections } from '../js/core/pdf/en378ReportSections.js';
import { getEN378SafetyData, listEN378SafetyData, listRefrigerants } from '../js/utils/refrigerants/index.js';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const exists = path => existsSync(new URL(path, root));
const json = path => JSON.parse(read(path));
const packageJson = json('package.json');
const serviceWorker = read('service-worker.js');

const EN378_RUNTIME_DIR = 'js/modules/en-378-safety-check';
const REQUIRED_RUNTIME_FILES = Object.freeze([
  'alternativeRiskMeasures.js',
  'chargeLimitCalculation.js',
  'config.js',
  'displayLabels.js',
  'importController.js',
  'index.js',
  'installationSafetyRequirements.js',
  'logic.js',
  'plannerGuidance.js',
  'refrigerantCoverage.js',
  'reportAdapter.js',
  'results.js',
  'savedRecords.js',
  'schema.js',
  'snapshotImport.js',
  'state.js',
  'stateConsistency.js'
]);
const REQUIRED_TESTS = Object.freeze([
  'test-en-378-safety-check.mjs',
  'test-en-378-charge-limit.mjs',
  'test-en-378-refrigerant-safety-data.mjs',
  'test-en-378-installation-requirements.mjs',
  'test-en-378-planner-guidance.mjs',
  'test-en-378-import-and-display.mjs',
  'test-en-378-refrigerant-coverage.mjs',
  'test-en-378-alternative-risk-measures.mjs',
  'test-en-378-contextual-inputs.mjs',
  'test-en-378-state-consistency.mjs',
  'test-en-378-pdf-sections.mjs',
  'test-en-378-saved-records.mjs'
]);
const RAW_UI_KEY_PATTERNS = Object.freeze([
  /not-assessed/,
  /not-applicable/,
  /measures-required/,
  /ready-for-assessment/,
  /import-rejected/,
  /chargeKg/,
  /roomVolumeM3/,
  /refrigerantId/,
  /accessCategory:required/,
  /qlmvKgM3/,
  /qlavKgM3/,
  /rclKgM3/,
  /state-consistency/,
  /hasMechanicalVentilation/,
  /hasSafetyShutoffValves/,
  /hasVentilationOpenings/,
  /hasIndependentAlarmPower/
]);

function runtimeFiles() {
  return readdirSync(new URL(`${EN378_RUNTIME_DIR}/`, root))
    .filter(file => file.endsWith('.js'))
    .sort();
}

function assertRuntimeStructure() {
  for (const file of REQUIRED_RUNTIME_FILES) {
    assert.ok(exists(`${EN378_RUNTIME_DIR}/${file}`), `EN 378 runtime file missing: ${file}`);
  }
  assert.deepEqual(runtimeFiles(), [...REQUIRED_RUNTIME_FILES].sort(), 'EN 378 runtime file set must be explicit and reviewed');
}

function assertNoForbiddenRuntimeCoupling() {
  for (const file of runtimeFiles()) {
    const source = read(`${EN378_RUNTIME_DIR}/${file}`);
    assert.doesNotMatch(source, /\.\.\/f-gases-check|\.\.\/\.\.\/modules\/f-gases-check/, `${file} must not import f-gases-check internals`);
    assert.doesNotMatch(source, /localStorage|sessionStorage/, `${file} must not access browser storage directly`);
    assert.doesNotMatch(source, /document\.querySelector|document\.getElementById/, `${file} must not query the global document directly`);
  }
}

function assertServiceExports() {
  assert.equal(typeof getEN378SafetyData, 'function');
  assert.equal(typeof listEN378SafetyData, 'function');
  assert.ok(getEN378SafetyData('R-32'), 'R-32 safety data must be resolvable through central refrigerant service');
  assert.ok(Array.isArray(listEN378SafetyData()), 'EN 378 safety data list must be exposed through central refrigerant service');
}

function assertModuleContract() {
  assert.equal(moduleDefinition.config?.id, 'en-378-safety-check');
  assert.equal(typeof moduleDefinition.calculate, 'function');
  assert.equal(typeof moduleDefinition.results, 'function');
  assert.equal(typeof moduleDefinition.report, 'function');
  assert.equal(typeof moduleDefinition.savedRecords, 'function');
  assert.equal(moduleDefinition.controller?.savedRecords?.enabled, true);
  assert.equal(moduleDefinition.controller.savedRecords.listKey, 'savedAssessments');
  assert.equal(moduleDefinition.controller.savedRecords.activeIdKey, 'activeSavedAssessmentId');
  assert.equal(moduleDefinition.controller.savedRecords.expandedIdKey, 'expandedSavedAssessmentId');
  assert.equal(moduleDefinition.controller.savedRecords.nameKey, 'savedAssessmentName');
  assert.equal(typeof moduleDefinition.controller.savedRecords.snapshot, 'function');
  assert.equal(typeof moduleDefinition.controller.savedRecords.hydrate, 'function');
}

function assertSchemaStateConsistency() {
  const stateKeys = new Set(Object.keys(initialState));
  const schemaKeys = new Set(schema.fields.map(field => field.key));
  const groupKeys = schema.groups.flatMap(group => group.fields || []);
  const virtualTypes = new Set(['action', 'notice', 'stats', 'custom']);

  for (const key of groupKeys) assert.ok(schemaKeys.has(key), `schema group references missing field: ${key}`);
  for (const field of schema.fields) {
    if (virtualTypes.has(field.type)) continue;
    assert.ok(stateKeys.has(field.key), `schema field lacks initialState key: ${field.key}`);
  }
  for (const key of ['savedAssessments', 'activeSavedAssessmentId', 'expandedSavedAssessmentId', 'savedAssessmentName']) {
    assert.ok(stateKeys.has(key), `saved-record state key missing: ${key}`);
  }
}

function assertPrecacheCoverage() {
  for (const file of REQUIRED_RUNTIME_FILES) {
    const asset = `./${EN378_RUNTIME_DIR}/${file}`;
    assert.ok(serviceWorker.includes(asset), `service-worker precache missing EN 378 asset: ${asset}`);
  }
}

function assertPackageGateCoverage() {
  assert.ok(packageJson.scripts['audit:en378']?.includes('audit-en-378-dependencies.mjs'), 'audit:en378 script must be present');
  assert.ok(packageJson.scripts.lint?.includes('npm run audit:en378'), 'lint must include audit:en378');
  for (const testFile of REQUIRED_TESTS) {
    assert.ok(packageJson.scripts['test:en378']?.includes(testFile), `test:en378 missing ${testFile}`);
    assert.ok(exists(`scripts/${testFile}`), `referenced EN 378 test file missing: ${testFile}`);
  }
}

function assertRefrigerantDataCoverage() {
  const unsupported = listRefrigerants()
    .filter(item => item.regulatory?.fluorinatedGreenhouseGas)
    .filter(item => !getEN378SafetyData(item.id))
    .map(item => item.id);
  assert.deepEqual(unsupported, [], `EN 378 safety data missing for F-Gases refrigerants: ${unsupported.join(', ')}`);
}

function assertNoRawKeysInSerializableUiOutput(label, value) {
  const serialized = JSON.stringify(value);
  for (const pattern of RAW_UI_KEY_PATTERNS) {
    assert.doesNotMatch(serialized, pattern, `${label} exposes internal key/status: ${pattern}`);
  }
}

function assertUiAndPdfOutputCoverage() {
  const scenarios = [
    {
      name: 'acceptable occupied space',
      state: {
        importedSystemName: 'Wärmepumpe Dachzentrale', refrigerantId: 'R-32', chargeKg: '2.5', roomVolumeM3: '50',
        installationLocation: 'occupied-space', installationClass: 'I', accessArea: 'general-access', usageType: 'commercial',
        applicationType: 'other', locationLevel: 'other', ventilationType: 'mechanical', hasGasWarningSystem: 'yes',
        hasMachineryRoom: 'no', hasDetector: 'yes', hasAlarm: 'yes', hasIndependentAlarmPower: 'yes'
      }
    },
    {
      name: 'alternative risk measures',
      state: {
        refrigerantId: 'R-32', chargeKg: '8', roomVolumeM3: '80', installationLocation: 'occupied-space', installationClass: 'I',
        accessArea: 'general-access', usageType: 'commercial', applicationType: 'other', locationLevel: 'other', ventilationType: 'mechanical',
        usesAlternativeRiskManagement: 'yes', hasGasWarningSystem: 'yes', hasMachineryRoom: 'no', hasDetector: 'yes', hasAlarm: 'yes',
        hasIndependentAlarmPower: 'yes', hasMechanicalVentilation: 'yes', hasVentilationOpenings: 'no', hasSafetyShutoffValves: 'no'
      }
    },
    {
      name: 'inconsistent class',
      state: {
        refrigerantId: 'R-513A', chargeKg: '24.4', roomVolumeM3: '6000', installationLocation: 'occupied-space', installationClass: 'II',
        accessArea: 'general-access', usageType: 'industrial', applicationType: 'other', locationLevel: 'other', ventilationType: 'mechanical',
        usesAlternativeRiskManagement: 'no'
      }
    }
  ];

  for (const scenario of scenarios) {
    const calculation = calculate(scenario.state);
    const resultModel = buildEN378SafetyCheckResultModel(scenario.state, calculation);
    const dto = buildEN378SafetyCheckReportDto({ state: scenario.state, calculation, generatedAt: '2026-09-01T00:00:00.000Z' });
    const pdfSections = buildEN378ReportSections(dto);
    assertNoRawKeysInSerializableUiOutput(`${scenario.name} result model`, resultModel);
    assertNoRawKeysInSerializableUiOutput(`${scenario.name} PDF sections`, pdfSections);
  }
}

assertRuntimeStructure();
assertNoForbiddenRuntimeCoupling();
assertServiceExports();
assertModuleContract();
assertSchemaStateConsistency();
assertPrecacheCoverage();
assertPackageGateCoverage();
assertRefrigerantDataCoverage();
assertUiAndPdfOutputCoverage();

console.log('EN 378 dependency and completeness audit passed.');
