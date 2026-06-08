import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate } from '../js/modules/buffer-storage/logic.js';
import {
  buildBufferRecord,
  savedBufferPatch,
  bufferSaveCard,
  bufferStorageSavedController
} from '../js/modules/buffer-storage/controller.js';
import { buildBufferStorageResultModel } from '../js/modules/buffer-storage/results.js';
import { createBufferStorageViewModel } from '../js/modules/buffer-storage/viewModel.js';

const indexSource = readFileSync('js/modules/buffer-storage/index.js', 'utf8');
const configSource = readFileSync('js/modules/buffer-storage/config.js', 'utf8');
const controllerSource = readFileSync('js/modules/buffer-storage/controller.js', 'utf8');
const viewSource = readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const viewModelSource = readFileSync('js/modules/buffer-storage/viewModel.js', 'utf8');
const resultsSource = readFileSync('js/modules/buffer-storage/results.js', 'utf8');
const schemaSource = readFileSync('js/modules/buffer-storage/schema.js', 'utf8');

assert.match(configSource, /phase-23e-hardening/, 'phase 23E status is declared');
assert.doesNotMatch(indexSource, /card\(|field\(|resultCard|mainResult|resultRows|mountModule\(/, 'index remains a pure platform adapter');
assert.doesNotMatch(indexSource, /savedCalculations|activeCalculationId|data-buffer-save|data-buffer-update|data-buffer-select|data-buffer-delete/, 'index contains no legacy saved-record contract');
assert.doesNotMatch(viewSource, /savedCalculations|activeCalculationId|data-buffer-save|data-buffer-update|data-buffer-select|data-buffer-delete|bindSavedRecordWorkflow/, 'view contains no legacy saved-record contract');
assert.doesNotMatch(`${viewModelSource}\n${resultsSource}`, /savedCalculations|activeCalculationId|createLineSectionController|core\/renderer/, 'viewModel/results remain storage-controller and renderer independent');
assert.match(controllerSource, /createLineSectionController\(\{/, 'controller uses the platform line-section controller');
assert.match(controllerSource, /data-buffer-dynamic/, 'saved-record inner island uses the buffer dynamic attribute');
assert.doesNotMatch(controllerSource, /data-puffer-dynamic/, 'incorrect puffer dynamic attribute is removed');

const requiredFields = [
  'plantName', 'calculationMode', 'mediumMode', 'glycolType', 'glycolConcentration',
  'qMaxKw', 'partLoadFactor', 'qLoadKw', 'compressorRunTimeMin', 'controllerDeltaT', 'existingSystemVolumeL',
  'qConsumerKw', 'qDefrostKw', 'qHeatingCircuitKw', 'maxDefrostTimeMin', 'hydraulicDeltaT',
  'consumerFlowM3h', 'bridgeTimeMin'
];
for (const field of requiredFields) {
  assert.match(schemaSource, new RegExp(`key:\\s*['"]${field}['"]`), `schema covers ${field}`);
}

const runtimeState = {
  calculationMode: 'runtime',
  plantName: 'Kaltwassersatz BT A',
  mediumMode: 'water',
  glycolType: 'ethylene',
  glycolConcentration: '35',
  qMaxKw: '100',
  partLoadFactor: '25',
  qLoadKw: '5',
  compressorRunTimeMin: '3',
  controllerDeltaT: '5',
  existingSystemVolumeL: '100',
  savedBuffers: [],
  activeBufferId: null,
  expandedBufferId: null
};
const runtimeResult = calculate(runtimeState);
assert.equal(runtimeResult.runtimePower, 20, 'runtime power handles percent-style part-load inputs');
assert.equal(runtimeResult.decisiveVolume, 71.8, 'runtime decisive buffer volume remains stable');
assert.equal(runtimeResult.nextStandardVolume, 80, 'standard volume selection remains stable');

const record = buildBufferRecord(runtimeState, runtimeResult, [], 'buffer-test', 'BT A');
assert.equal(record.id, 'buffer-test');
assert.equal(record.name, 'BT A');
assert.equal(record.result.standard, 80);
assert.equal(record.result.medium, 'Wasser');
assert.equal(record.state.savedBuffers, undefined, 'record snapshot excludes savedBuffers');
assert.equal(record.state.activeBufferId, undefined, 'record snapshot excludes activeBufferId');
assert.equal(record.state.expandedBufferId, undefined, 'record snapshot excludes expandedBufferId');

const legacyRecord = { id: 'legacy-1', name: 'Altprojekt', state: { calculationMode: 'reserve', plantName: 'Alt', consumerFlowM3h: '3', bridgeTimeMin: '10' } };
const hydrated = savedBufferPatch(legacyRecord, { savedCalculations: [legacyRecord], savedBuffers: [], expandedBufferId: 'other' });
assert.equal(hydrated.activeBufferId, 'legacy-1', 'legacy record hydrates into activeBufferId');
assert.deepEqual(hydrated.savedBuffers, [legacyRecord], 'legacy savedCalculations are restored as savedBuffers');
assert.equal(hydrated.plantName, 'Altprojekt', 'record display name wins during hydration');

const legacyCard = bufferSaveCard({ plantName: 'Alt', savedCalculations: [legacyRecord], savedBuffers: [], activeBufferId: null, expandedBufferId: null });
assert.match(legacyCard, /Altprojekt/, 'legacy savedCalculations render in the platform saved-record card');
assert.match(legacyCard, /data-line-select/, 'saved records render with platform line-section selectors');
assert.doesNotMatch(legacyCard, /data-buffer-select|data-buffer-delete|data-buffer-save|data-buffer-update/, 'legacy buffer data attributes are not rendered');

const reserveState = { ...runtimeState, calculationMode: 'reserve', consumerFlowM3h: '3', bridgeTimeMin: '10' };
const reserveResult = calculate(reserveState);
const resultModel = buildBufferStorageResultModel(reserveState, reserveResult);
assert.equal(resultModel.primary.primary.value, '500', 'result model formats reserve result consistently');
assert.ok(Array.isArray(resultModel.groups) && resultModel.groups.length >= 2, 'result model exposes grouped result sections');
assert.ok(Array.isArray(resultModel.notices) && resultModel.notices.length >= 1, 'result model exposes notices');

const vm = createBufferStorageViewModel(reserveState, reserveResult);
assert.equal(vm.isReserveMode, true, 'view model exposes reserve mode flag');
assert.equal(vm.resultModel.primary.primary.value, '500', 'view model carries result model');
assert.equal(typeof bufferStorageSavedController.renderCard, 'function', 'saved controller exposes platform renderCard');

console.log('buffer-storage phase23e hardening regression ok');
