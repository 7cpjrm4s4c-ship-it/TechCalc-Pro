import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const renderer = readFileSync('js/core/renderer.js', 'utf8');
const domUpdate = readFileSync('js/core/domUpdate.js', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.match(renderer, /export function cssEscape\(/, 'renderer must define cssEscape for stable selector snapshots');
assert.match(renderer, /window\.CSS\?\.escape/, 'renderer cssEscape must use native CSS.escape when available');
assert.doesNotMatch(renderer, /getStableSelector[\s\S]*ReferenceError/, 'stable selector path must not rely on an undefined cssEscape');

assert.match(domUpdate, /__tcReplacingContent/, 'safeReplaceContent must guard reentrant dynamic island replacements');
assert.match(domUpdate, /root\.isConnected === false/, 'safeReplaceContent must skip detached dynamic island roots');
assert.match(domUpdate, /no longer a child/i, 'safeReplaceContent must absorb browser DOM replacement races observed in Edge');

assert.equal(pkg.scripts['test:phase37b1a'], 'node tests/platform-browser-runtime-phase37b1a.test.mjs');

console.log('Phase 37B.1A browser console cleanup guard passed.');
