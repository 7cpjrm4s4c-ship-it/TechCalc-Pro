import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

assert.match(runtimeSource, /getRenderScheduler\(root\)\?\.flushNow/, 'Segment changes must flush the platform renderer immediately.');
assert.match(runtimeSource, /__tcPlatformSavedRecordDirectBinding/, 'Saved records need a direct platform binding for reliable mobile selection.');
assert.match(runtimeSource, /data-saved-load/, 'Saved record direct binding must target platform saved-load cards.');
assert.match(runtimeSource, /tcSavedDirectAt/, 'Saved record direct binding must suppress duplicate synthetic clicks.');
assert.match(cssSource, /grid-template-columns:\s*minmax\(0, 1fr\) 82px 38px/, 'Collection quantity/delete columns must be compact enough for long fixture labels.');
assert.match(cssSource, /overflow-wrap:\s*anywhere/, 'Collection content must wrap long fixture labels without colliding with quantity fields.');

console.log('phase17c2 reference-module bugfix regression ok');
