import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const domUpdate = readFileSync(new URL('../js/core/domUpdate.js', import.meta.url), 'utf8');
const lifecycle = readFileSync(new URL('../js/core/moduleLifecycleAdapter.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');

assert.match(domUpdate, /root\.__tcLastHtml === next && root\.innerHTML === next/, 'safeReplaceContent must validate the real DOM before skipping replacement.');
assert.match(lifecycle, /root\.__tcLastHtml = '';/, 'Module lifecycle cleanup must clear the DOM render cache.');
assert.match(app, /app\.__tcLastHtml = '';/, 'Router loading placeholder must invalidate the DOM render cache.');

console.log('phase15e dom cache loading regression ok');
