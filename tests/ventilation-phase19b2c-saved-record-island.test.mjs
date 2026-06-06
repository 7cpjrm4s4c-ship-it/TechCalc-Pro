import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('../js/modules/ventilation/index.js', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../js/modules/ventilation/controller.js', import.meta.url), 'utf8');
const ventilationSource = `${indexSource}\n${controllerSource}`;
const lineControllerSource = readFileSync(new URL('../js/platform/lineSectionController/index.js', import.meta.url), 'utf8');
const dynamicRendererSource = readFileSync(new URL('../js/platform/dynamicRenderer/index.js', import.meta.url), 'utf8');
const configSource = readFileSync(new URL('../js/modules/ventilation/config.js', import.meta.url), 'utf8');

assert.match(configSource, /phase-19b2c-saved-record-island/, 'ventilation declares phase 19B.2C saved-record-island migration');
assert.match(ventilationSource, /createLineSectionController\(\{/, 'ventilation saved records are delegated to the platform line-section controller');
assert.match(ventilationSource, /dynamicDataAttr:\s*'data-line-dynamic'/, 'ventilation requests the neutral line-section dynamic island attribute');
assert.match(ventilationSource + dynamicRendererSource, /\[data-line-dynamic=\"line-sections\"\]|\[data-line-dynamic="line-sections"\]/, 'ventilation refreshes saved rows through the neutral dynamic island selector');
assert.doesNotMatch(ventilationSource, /\[data-hc-dynamic="line-sections"\]/, 'ventilation no longer targets the heating-specific saved-record island selector');
assert.match(lineControllerSource, /dynamicDataAttr\s*=\s*'data-line-dynamic'/, 'line-section controller exposes a neutral dynamic island attribute contract');
assert.match(lineControllerSource, /\$\{dynamicDataAttr\}="\$\{dynamicAttr\}" data-hc-dynamic="\$\{dynamicAttr\}"/, 'line-section controller keeps heating compatibility while exposing the neutral selector');
assert.doesNotMatch(ventilationSource, /registerCentralActions\(/, 'ventilation module does not register its own saved-record action map');
assert.doesNotMatch(ventilationSource, /createRecordId\(/, 'ventilation module does not create saved-record ids directly');
assert.doesNotMatch(ventilationSource, /replaceRecord\(/, 'ventilation module does not replace saved records directly');
assert.doesNotMatch(ventilationSource, /removeRecord\(/, 'ventilation module does not remove saved records directly');

console.log('ventilation phase19b2c saved-record island regression ok');
