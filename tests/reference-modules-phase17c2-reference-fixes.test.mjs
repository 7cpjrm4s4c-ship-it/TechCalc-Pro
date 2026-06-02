import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const savedRecordsSource = readFileSync(new URL('../js/core/savedRecords.js', import.meta.url), 'utf8');

assert.match(runtimeSource, /const scheduler = getRenderScheduler\(root\)/, 'Segment changes must use the platform render scheduler.');
assert.match(runtimeSource, /scheduler\?\.flushNow\?\.\(action\)/, 'Segment changes must flush the platform renderer immediately.');
assert.doesNotMatch(runtimeSource, /__tcPlatformSavedRecordDirectBinding/, 'Saved records must not bypass the central action pipeline.');
assert.match(savedRecordsSource, /data-saved-load/, 'Saved record actions must target platform saved-load cards.');
assert.match(runtimeSource, /'saved:load'/, 'Saved record load must be a central platform action.');
assert.match(cssSource, /grid-template-columns:\s*minmax\(0, 1fr\) 82px 38px/, 'Collection quantity/delete columns must be compact enough for long fixture labels.');
assert.match(cssSource, /overflow-wrap:\s*anywhere/, 'Collection content must wrap long fixture labels without colliding with quantity fields.');

console.log('phase17c2 reference-module bugfix regression ok');
