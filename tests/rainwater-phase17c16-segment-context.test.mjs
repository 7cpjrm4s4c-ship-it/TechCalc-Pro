import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');

assert.match(runtime, /root\.__tcPlatformSegmentContext\s*=\s*\{ fields, commit \}/, 'platform segment direct bridge must refresh the active module context on every bind.');
assert.doesNotMatch(runtime, /root\.__tcPlatformSegmentContext\s*=\s*null/, 'platform segment context must not be cleared after binding.');
assert.match(runtime, /const context = root\.__tcPlatformSegmentContext \|\| \{\}/, 'direct bridge must resolve the current context at event time instead of using a stale closure.');
assert.match(runtime, /context\.commit\(segment, event, \{ settled: false \}\)/, 'direct bridge must invoke the current module segment commit handler immediately.');

console.log('rainwater phase17c.16 segment context bridge ok');
