import assert from 'node:assert/strict';
import fs from 'node:fs';

const moduleDir = new URL('../js/modules/drinking-water/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, moduleDir), 'utf8');

const index = read('index.js');
const view = read('view.js');
const controller = read('controller.js');
const dynamicRenderer = read('dynamicRenderer.js');
const config = read('config.js');

assert.match(index, /createPlatformModule/);
assert.match(index, /dynamicUpdate:\s*updateDrinkingWaterDynamic/);
assert.match(index, /isDynamicAction:\s*isDynamicDrinkingWaterAction/);
assert.doesNotMatch(index, /safeReplaceContent\(|renderModuleShell\(|mountModule/);

assert.doesNotMatch(view, /from '\.\/controller\.js'/, 'view.js must not import controller.js');
assert.match(view, /export function renderUsageUnitRows/);
assert.match(view, /export function renderSingleRows/);

assert.doesNotMatch(controller, /renderUsageUnitRows|renderSingleRows/);
assert.doesNotMatch(controller, /safeReplaceContent\(root,/);
assert.match(controller, /refreshDrinkingWater\(root\)/);

assert.match(dynamicRenderer, /syncFields/);
assert.match(dynamicRenderer, /INPUT_KEYS/);
assert.match(dynamicRenderer, /RESULT_KEYS/);
assert.match(dynamicRenderer, /setIslandInner\(root, '\[data-dw-dynamic="input"\]'/);
assert.match(dynamicRenderer, /setIslandInner\(root, '\[data-dw-dynamic="result"\]'/);

assert.match(config, /phase-25c-dynamic-controller-contract/);

console.log('drinking-water phase25c dynamic controller contract ok');
