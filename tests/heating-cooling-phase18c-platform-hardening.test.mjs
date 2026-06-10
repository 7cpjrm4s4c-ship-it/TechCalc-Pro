import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const configSource = fs.readFileSync('js/modules/heating-cooling/config.js', 'utf8');
const schemaSource = fs.readFileSync('js/modules/heating-cooling/schema.js', 'utf8');
const dynamicRendererSource = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');
const lineSectionSource = fs.readFileSync('js/platform/lineSectionController/index.js', 'utf8');
const runtimeSource = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');

assert.match(configSource, /phase-18c-platform-hardening/, 'Phase 18C must be recorded in the module migration status.');
assert.doesNotMatch(configSource, /phase-18b2-line-section-controller[\s\S]*phase-18b2-line-section-controller/, 'migration status must not contain duplicate phase markers.');
assert.doesNotMatch(moduleSource, /compatibility markers|source-compatibility markers|historical regression audits/, 'heating/cooling module must not carry source-only compatibility marker comments.');
assert.doesNotMatch(moduleSource, /registerCentralActions/, 'line-section action registration must stay outside the module.');
assert.doesNotMatch(moduleSource, /function mountHeatingCooling|mount\(root\)\s*\{\s*return mountHeatingCooling/, 'module-owned mount must stay removed.');
assert.match(moduleSource, /export default createPlatformModule\(\{[\s\S]*view,[\s\S]*bind: bindHeatingCoolingPlatform,[\s\S]*dynamicUpdate: updateHeatingCoolingDynamic,[\s\S]*isDynamicAction: isDynamicHeatingCoolingAction[\s\S]*\}\);/, 'module must use the platform runtime with explicit custom-view hooks.');
assert.match(schemaSource, /layout:\s*\{[\s\S]*order:\s*\[[\s\S]*'medium'[\s\S]*'operatingMode'[\s\S]*'activeInputs'[\s\S]*'result'[\s\S]*'recommendation'[\s\S]*'lineSections'/, 'schema layout order must preserve the approved card order.');
assert.match(dynamicRendererSource, /lineStructural[\s\S]*lineSectionController\?\.updateControls\?\.\(root, s\)[\s\S]*lineSectionController\?\.renderRows\?\.\(s\)/, 'line/saved actions must only refresh the line-section island.');
assert.match(lineSectionSource, /registerCentralActions\(root,[\s\S]*'line:save'[\s\S]*'saved:toggle'/, 'line-section actions must remain centralized in the platform controller.');
assert.match(runtimeSource, /if \(action\.startsWith\('platform:segment:'\) \|\| action === 'segment:select'\) \{[\s\S]*state\.set\(patch, \{ action, notify: true \}\);[\s\S]*\} else \{[\s\S]*preserveScroll/, 'segment commits must bypass scroll preservation for immediate mobile updates.');

console.log('heating-cooling phase18c platform-hardening regression ok');
