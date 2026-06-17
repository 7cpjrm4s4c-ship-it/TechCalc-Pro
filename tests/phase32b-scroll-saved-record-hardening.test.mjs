import assert from 'node:assert/strict';
import fs from 'node:fs';

const eventPipeline = fs.readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const drinkingWaterController = fs.readFileSync(new URL('../js/modules/drinking-water/controller.js', import.meta.url), 'utf8');
const components = fs.readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

assert.match(eventPipeline, /import \{ markCommittedAction \} from '\.\/formActions\.js';/, 'central event pipeline must be able to mark action intent before blur');
assert.match(eventPipeline, /touchstart[\s\S]*markCommittedAction\(root\)[\s\S]*confirmSurface/, 'touchstart actions must mark committed action before mobile blur/surface confirmation');
assert.match(eventPipeline, /pointerdown[\s\S]*markCommittedAction\(root\)[\s\S]*confirmSurface/, 'pointerdown actions must mark committed action before blur/surface confirmation');
assert.match(eventPipeline, /actionInProgress[\s\S]*notify:\s*true && !actionInProgress/, 'blur render must stay silent while a committed action is in progress');

assert.match(drinkingWaterController, /function saveUnit\([\s\S]*runWithoutScrollJump/, 'saving a usage unit must preserve viewport position');
assert.match(drinkingWaterController, /function saveSingle\([\s\S]*runWithoutScrollJump/, 'saving a single group must preserve viewport position');
assert.match(drinkingWaterController, /function deleteUnit\([\s\S]*runWithoutScrollJump/, 'deleting a usage unit must preserve viewport position');
assert.match(drinkingWaterController, /function deleteSingle\([\s\S]*runWithoutScrollJump/, 'deleting a single group must preserve viewport position');

assert.match(components, /\.card,[\s\S]*\.saved-record-card[\s\S]*overflow-wrap:\s*anywhere/, 'global cards must guard against text overflow');
assert.match(components, /\.dw-save-dialog \.field input[\s\S]*height:\s*42px/, 'drinking-water save-dialog fields must use consistent height');

console.log('Phase 32B scroll and saved-record hardening source checks passed.');
