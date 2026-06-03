import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const rainwaterController = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const wastewaterController = readFileSync('js/modules/wastewater/controller.js', 'utf8');
const rainwaterResults = readFileSync('js/modules/rainwater/results.js', 'utf8');
const wastewaterResults = readFileSync('js/modules/wastewater/results.js', 'utf8');
const heating = readFileSync('js/modules/heating-cooling/index.js', 'utf8');

assert.match(heating, /data-line-select/, 'baseline: Heizung/Kälte uses line-section select attributes.');
assert.match(runtime, /Heizung\/Kälte parity/, 'Platform saved records must explicitly use the heating/cooling interaction contract.');
assert.match(runtime, /'line:save': save/, 'Platform saved records must register the same line:save action as Heizung/Kälte.');
assert.match(runtime, /'line:update': update/, 'Platform saved records must register the same line:update action as Heizung/Kälte.');
assert.doesNotMatch(runtime, /function createSavedRecordEventBridge/, 'Former SavedRecord event bridge must be removed.');
assert.match(runtime, /root\.__tcPlatformSavedRecordContext\s*=\s*null/, 'Central pipeline SavedRecord context must not intercept the direct heating-style binding.');
assert.doesNotMatch(runtime, /action === 'saved:add'|action === 'saved:update'/, 'Legacy saved:add/saved:update handlers must not compete with line save/update.');

for (const [name, source] of [['rainwater', rainwaterController], ['wastewater', wastewaterController]]) {
  assert.match(source, /attrs:\s*\{\s*loadAttr:\s*'data-line-select',\s*toggleAttr:\s*'data-line-toggle',\s*deleteAttr:\s*'data-line-delete'\s*\}/, `${name} must keep the heating-style saved attrs.`);
  assert.doesNotMatch(source, /data-saved-|SavedRecordEventBridge|bindSavedRecordWorkflow|bindSavedRecordList/, `${name} must not carry local saved-record patches.`);
}

for (const [name, source] of [['rainwater', rainwaterResults], ['wastewater', wastewaterResults]]) {
  assert.doesNotMatch(source, /saved:add|saved:update/, `${name} saved result model must not render legacy saved add/update actions.`);
  assert.match(source, /loadAttr:\s*'data-line-select'/, `${name} saved result model must render line-select.`);
  assert.match(source, /toggleAttr:\s*'data-line-toggle'/, `${name} saved result model must render line-toggle.`);
  assert.match(source, /deleteAttr:\s*'data-line-delete'/, `${name} saved result model must render line-delete.`);
}

assert.match(runtime, /scheduler\?\.flushNow\?\.\(action\)/, 'Segment switches must force an immediate schema/result render.');
assert.match(runtime, /settled-timeout/, 'Segment switches must keep the mobile settled fallback.');

console.log('phase17c9 heating-style saved-record contract regression ok');
