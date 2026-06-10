import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/ventilation/index.js';
import config from '../js/modules/ventilation/config.js';
import { state } from '../js/modules/ventilation/state.js';

const source = readFileSync(new URL('../js/modules/ventilation/index.js', import.meta.url), 'utf8');
const stateSource = readFileSync(new URL('../js/modules/ventilation/state.js', import.meta.url), 'utf8');

assert.match(config.migrationStatus, /phase-19b1-platform-mount/, 'config records phase 19B.1');
assert.equal(typeof module.mount, 'function', 'platform module exposes mount');
assert.equal(module.state, state, 'module exports the normalized ventilation state');
assert.match(source, /createPlatformModule\(\{/, 'ventilation uses createPlatformModule');
assert.match(source, /view,/, 'custom ventilation view is passed to platform runtime');
assert.match(source, /bind:\s*bindVentilationPlatform/, 'line-section binding runs through platform bind hook');
assert.match(source, /dynamicUpdate:\s*updateVentilationDynamic/, 'dynamic update runs through platform hook');
assert.match(source, /isDynamicAction:\s*isDynamicVentilationAction/, 'dynamic action policy is platform-provided');
assert.doesNotMatch(source, /function mountVentilation/, 'legacy mountVentilation is removed');
assert.doesNotMatch(source, /bindCommonInputs|bindNoClickScroll/, 'common input and scroll binding are owned by platform runtime');
assert.match(stateSource, /ventLineSections:\s*\[\]/, 'line sections are store-backed');
assert.match(stateSource, /activeVentLineSectionId:\s*null/, 'active line section id is store-backed');

console.log('ventilation phase19b1 platform-mount regression ok');
