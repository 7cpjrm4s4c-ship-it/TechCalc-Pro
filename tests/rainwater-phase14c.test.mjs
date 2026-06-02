import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const results = readFileSync(new URL('../js/modules/rainwater/results.js', import.meta.url), 'utf8');

assert.match(controller, /deleteAttr:\s*'data-saved-delete'/, 'Rainwater surface list must expose delete through platform saved-record config.');
assert.match(controller, /surfaceMode:[\s\S]*patch:\s*modeDefaultsPatch/, 'Rainwater surfaceMode switch must be handled through platform segment config.');
assert.match(controller, /calculationType:\s*mode/, 'Rainwater surfaceMode switch must keep calculationType in sync.');
assert.ok(!/card\('Regenflächen', surfaceInputBlock\(s, r\), 'green'\),\s*saveCard\(s\)/.test(source), 'Rainwater must not render the extra calculation save card in the main input flow.');
assert.match(results, /export function savedRecords/, 'Rainwater surface list must be provided as saved-record data only.');

console.log('rainwater phase14c workflow regression ok');
