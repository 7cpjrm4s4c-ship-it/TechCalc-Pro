import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import module from '../js/modules/drinking-water/index.js';
import config from '../js/modules/drinking-water/config.js';
import schema from '../js/modules/drinking-water/schema.js';
import { state } from '../js/modules/drinking-water/state.js';
import { calculate, createConsumer, createUsageUnit, createSingleGroup, writeUsageUnits, writeSingleConsumers } from '../js/modules/drinking-water/logic.js';
import { createDrinkingWaterViewModel } from '../js/modules/drinking-water/viewModel.js';
import { renderView, renderInputCard, renderResultCard } from '../js/modules/drinking-water/view.js';
import { buildDrinkingWaterResultModel, selectedFixturesList } from '../js/modules/drinking-water/results.js';
import { isDynamicDrinkingWaterAction, updateDrinkingWaterDynamic } from '../js/modules/drinking-water/dynamicRenderer.js';
import { normalizeDrinkingWaterSavedState, refreshDrinkingWater } from '../js/modules/drinking-water/controller.js';

const base = new URL('../js/modules/drinking-water/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');
const projectStorage = readFileSync('js/core/projectStorage.js', 'utf8');

assert.match(read('config.js'), /phase-25e-final-hardening/, 'phase 25E status is declared');
assert.equal(config.id, 'drinking-water', 'module config id remains stable');
assert.equal(module.config.id, 'drinking-water', 'platform module exposes drinking-water config');
assert.ok(Array.isArray(schema.fields), 'schema remains form-schema compatible');

const expectedFiles = ['config.js','schema.js','state.js','logic.js','results.js','controller.js','viewModel.js','view.js','dynamicRenderer.js','index.js'];
const files = new Set(readdirSync(new URL('../js/modules/drinking-water/', import.meta.url)));
for (const file of expectedFiles) assert.ok(files.has(file), `${file} must exist`);

const index = read('index.js');
assert.ok(index.split('\n').length <= 25, 'index.js remains a thin platform adapter');
assert.match(index, /createPlatformModule\(/, 'platform runtime is active');
assert.doesNotMatch(index, /mountModule|renderModuleShell|querySelector|addEventListener|mainResult|resultCard|resultRows|safeReplaceContent/, 'index has no legacy mount, DOM, or renderer code');

assert.doesNotMatch(read('viewModel.js'), /querySelector|addEventListener|renderModuleShell|safeReplaceContent|mountModule/, 'viewModel has no DOM/controller coupling');
assert.doesNotMatch(read('view.js'), /calculate\(|querySelector|addEventListener|safeReplaceContent|mountModule|mainResult|resultCard|resultRows/, 'view stays render-only and uses prepared viewModel data');
assert.match(read('view.js'), /tc-accordion__summary-text dw-save-dialog__summary/, 'save dialog heading/subheading spacing contract stays in place');
assert.match(read('view.js'), /data-dw-dynamic="input"/, 'input dynamic island is present');
assert.match(read('view.js'), /data-dw-dynamic="result"/, 'result dynamic island is present');
assert.doesNotMatch(read('results.js'), /renderModuleShell|mountModule|querySelector|mainResult|resultCard|resultRows/, 'results file has no DOM or legacy renderer coupling');
assert.match(read('results.js'), /renderResultModel/, 'result model renders through platform result renderer');
assert.match(read('dynamicRenderer.js'), /preserveScroll/, 'dynamic renderer preserves viewport during island refresh');
assert.doesNotMatch(read('dynamicRenderer.js'), /root\.innerHTML\s*=|safeReplaceContent\(root/, 'dynamic renderer must not replace the full module root');
assert.match(read('controller.js'), /__tcDrinkingWaterActionsBound/, 'controller binding remains idempotent');
assert.match(read('controller.js'), /preserveScrollPosition/, 'manual controller refreshes preserve scroll');
assert.doesNotMatch(read('controller.js'), /safeReplaceContent\(root,|mountModule|mainResult|resultCard|resultRows/, 'controller must not replace full module root or use legacy result renderers');

assert.match(projectStorage, /normalizeDrinkingWaterProjectModule/, 'project storage keeps drinking-water restore normalizer');
assert.match(projectStorage, /savedUsageUnits: usageUnits/, 'usage units are restored into savedUsageUnits');
assert.match(projectStorage, /savedSingleConsumers: singleConsumers/, 'single consumers are restored into savedSingleConsumers');

writeUsageUnits([]);
writeSingleConsumers([]);
state.reset({ notify: false });
const draftOnly = {
  ...state.get(),
  unitName: 'Draft Bad',
  unitConsumerType: 'shower',
  unitCount: '99',
  unitDraftConsumers: [createConsumer({ typeId: 'shower', count: 99 })],
  singleDraftConsumers: [createConsumer({ typeId: 'tapDn15', count: 3, permanent: true })]
};
const emptyResult = calculate(draftOnly);
assert.equal(emptyResult.usageUnits.length, 0, 'draft usage-unit inputs must not affect calculation');
assert.equal(emptyResult.singleGroups.length, 0, 'draft single-consumer inputs must not affect calculation');
assert.equal(emptyResult.peakFlow, 0, 'startup/draft-only result remains empty');
const emptyModel = buildDrinkingWaterResultModel(draftOnly, emptyResult);
assert.equal(emptyModel.primary.primary.value, '—', 'empty startup primary result is blank');
assert.match(renderResultCard(createDrinkingWaterViewModel(draftOnly, emptyResult)), /Spitzendurchfluss/, 'result card still renders with blank values');
assert.match(selectedFixturesList(emptyResult), /Noch keine Einrichtungsgegenstände ausgewählt/, 'fixture list ignores drafts');

const savedUnit = createUsageUnit({
  name: 'Bad final',
  consumers: [createConsumer({ typeId: 'shower', count: 2 })],
  simultaneityFactor: '0.6'
});
const savedSingle = createSingleGroup({
  name: 'Außenzapfstelle final',
  consumers: [createConsumer({ typeId: 'tapDn15', count: 1, permanent: true })]
});
const savedState = { ...state.get(), savedUsageUnits: [savedUnit], savedSingleConsumers: [savedSingle] };
const savedResult = calculate(savedState);
assert.equal(savedResult.usageUnits.length, 1, 'saved usage units are included in calculation');
assert.equal(savedResult.singleGroups.length, 1, 'saved single groups are included in calculation');
assert.ok(savedResult.peakFlow > 0, 'saved records produce a result');
assert.match(selectedFixturesList(savedResult), /Dusche/, 'fixture list includes saved usage-unit fixtures');
assert.match(selectedFixturesList(savedResult), /Auslauf DN15|Auslaufventil/, 'fixture list includes saved single consumers');

const vm = createDrinkingWaterViewModel(savedState, savedResult);
assert.equal(vm.savedUsageUnits.length, 1, 'viewModel exposes only persistent saved usage units');
assert.equal(vm.savedSingleGroups.length, 1, 'viewModel exposes only persistent saved single groups');
assert.match(renderInputCard(vm), /dw-save-dialog__body/, 'input card keeps save-dialog body spacing hook');
assert.match(renderView(savedState), /data-dw-dynamic="input"/, 'full view has input island');
assert.equal(typeof updateDrinkingWaterDynamic, 'function', 'dynamic updater is exported');
assert.equal(isDynamicDrinkingWaterAction({ action: 'initial' }), false, 'initial action is not dynamic');
assert.equal(isDynamicDrinkingWaterAction({ action: 'dw:unit-save' }), true, 'saved-record actions are dynamic');
assert.equal(typeof refreshDrinkingWater, 'function', 'controller refresh API is available');

writeUsageUnits([savedUnit]);
writeSingleConsumers([savedSingle]);
const hydrated = normalizeDrinkingWaterSavedState({ savedUsageUnits: [], savedSingleConsumers: [] });
assert.equal(hydrated.savedUsageUnits.length, 1, 'legacy usage-unit memory hydrates savedUsageUnits');
assert.equal(hydrated.savedSingleConsumers.length, 1, 'legacy single-consumer memory hydrates savedSingleConsumers');
writeUsageUnits([]);
writeSingleConsumers([]);

console.log('drinking-water phase25e final hardening regression ok');
