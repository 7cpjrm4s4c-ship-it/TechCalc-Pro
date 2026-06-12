import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const tokens = read('css/tokens.css');
const components = read('css/components.css');
const layout = read('css/layout.css');
const modules = read('css/modules.css');
const app = read('js/core/app.js');
const eventPipeline = read('js/core/eventPipeline.js');
const pressure = read('js/modules/pressure-holding/controller.js');
const drinking = read('js/modules/drinking-water/controller.js');
const drinkingDyn = read('js/modules/drinking-water/dynamicRenderer.js');
const drinkingLogic = read('js/modules/drinking-water/logic.js');
const hx = read('js/modules/hx-diagram/controller.js');
const hxTest = read('tests/hx-diagram-phase32a3-mobile-action-hardening.test.mjs');
const phase32bTest = read('tests/phase32b-scroll-saved-record-hardening.test.mjs');
const phase32dTest = read('tests/phase32d-loading-release-notes.test.mjs');
const cssSmoke = read('tests/phase34d-css-regression-smoke.test.mjs');

// Global UI / P3 visual contract evidence.
assert.match(tokens, /--tc-gap:\s*10px;/, 'global spacing token must be 10px');
assert.match(tokens, /--tc-card-padding:\s*10px;/, 'global card padding token must be 10px');
assert.match(components, /\.card,[\s\S]*\.result-card[\s\S]*padding:\s*var\(--tc-card-padding\)/, 'primary cards must use centralized card padding');
assert.match(components, /\.line-section-card,[\s\S]*\.saved-record-card,[\s\S]*padding:\s*var\(--tc-gap\)/, 'saved-record cards must use centralized 10px spacing');
assert.match(layout, /\.module-view[\s\S]*gap:\s*var\(--ui-gap\)/, 'module views must use centralized ui gap');
assert.match(layout, /\.tc-stack[\s\S]*gap:\s*var\(--ui-gap\)/, 'module stacks must use centralized ui gap');
assert.equal((components.match(/!important/g) || []).length, 0, 'components.css must remain override-free');
assert.equal((modules.match(/!important/g) || []).length, 0, 'modules.css must remain override-free');
assert.match(cssSmoke, /report\.moduleCount, 11/, 'CSS regression smoke must cover all 11 modules');

// Saved-record cluster evidence.
assert.match(pressure, /createSavedRecordActions/, 'pressure-holding must use saved-record action controller');
assert.match(pressure, /beforeCreate:[\s\S]*commitAllFields/, 'pressure-holding save must commit form fields before create/update');
assert.match(pressure, /'pressure:save':\s*actions\.save/, 'pressure-holding save action must be registered');
assert.match(pressure, /'saved:load':\s*actions\.load/, 'pressure-holding load action must be registered');
assert.match(eventPipeline, /touchstart[\s\S]*markCommittedAction\(root\)[\s\S]*confirmSurface/, 'touchstart must mark committed actions before blur confirmation');
assert.match(eventPipeline, /pointerdown[\s\S]*markCommittedAction\(root\)[\s\S]*confirmSurface/, 'pointerdown must mark committed actions before blur confirmation');
assert.match(phase32bTest, /saved-record hardening source checks passed/, 'saved-record hardening test must be present');

// Scroll / keyboard action evidence.
assert.match(drinking, /function saveUnit\([\s\S]*runWithoutScrollJump/, 'drinking-water saveUnit must preserve viewport');
assert.match(drinking, /function saveSingle\([\s\S]*runWithoutScrollJump/, 'drinking-water saveSingle must preserve viewport');
assert.match(drinking, /function deleteUnit\([\s\S]*runWithoutScrollJump/, 'drinking-water deleteUnit must preserve viewport');
assert.match(drinking, /root\.addEventListener\('pointerdown',[\s\S]*true\)/, 'drinking-water must support early pointer actions');
assert.match(drinking, /root\.addEventListener\('touchstart',[\s\S]*passive:false/, 'drinking-water must support early touch actions');
assert.match(drinkingLogic, /singleGroupSource = normalizeSingleGroups\(Array\.isArray\(s\.savedSingleConsumers\)/, 'drinking-water composition must use saved single consumers as source');

// h,x critical UX evidence.
assert.match(hx, /rootEl\.addEventListener\('pointerdown',\s*earlyAction,\s*true\)/, 'h,x sign/clear must run on pointerdown');
assert.match(hx, /rootEl\.addEventListener\('touchstart',\s*earlyAction,[\s\S]*passive:\s*false/, 'h,x sign/clear must run on touchstart');
assert.match(hx, /shouldSkipDuplicateHxAction/, 'h,x must deduplicate pointer/touch/click sequences');
assert.match(hx, /function clearDiagram[\s\S]*activePath:\s*\[\][\s\S]*expandedProcessId:\s*null[\s\S]*points:\s*\[\]/, 'h,x clear must reset diagram and process state');
assert.match(components, /body\.tc-keyboard-open \.module-nav \{ opacity:\s*1; pointer-events:\s*auto; transform:\s*translateY\(0\); \}/, 'mobile nav pill must remain visible while keyboard flag is set');
assert.match(hxTest, /mobile action hardening source ok/, 'h,x mobile hardening test must be present');

// Loading / release notes evidence.
assert.match(app, /scheduleLazyModulePreload\(\)/, 'module preload scheduling must run after app boot');
assert.match(app, /requestIdleCallback\(preload, \{ timeout: 1500 \}\)/, 'module preload must use idle scheduling');
assert.match(app, /RELEASE_NOTES\.md/, 'release notes must load from RELEASE_NOTES.md');
assert.match(phase32dTest, /release notes/i, 'phase32d release-notes test must be present');

console.log('Phase 32E RC bug verification source matrix passed.');
