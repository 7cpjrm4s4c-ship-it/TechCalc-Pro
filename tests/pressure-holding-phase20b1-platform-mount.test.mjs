import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync('js/modules/pressure-holding/index.js', 'utf8');
const configSource = readFileSync('js/modules/pressure-holding/config.js', 'utf8');

assert.match(indexSource, /createPlatformModule\(\{/, 'pressure-holding uses the platform module runtime mount contract');
assert.doesNotMatch(indexSource, /mountModule\(/, 'pressure-holding no longer mounts through the legacy mountModule call');
assert.doesNotMatch(indexSource, /from ['"]\.\.\/\.\.\/core\/mount\.js['"]/, 'pressure-holding no longer imports the legacy mount helper');
assert.match(indexSource, /bind:\s*root\s*=>\s*bindPressureHoldingActions/, 'existing pressure-holding saved-record binding is retained through the platform adapter');
assert.match(configSource, /phase-20b1-platform-mount/, 'pressure-holding declares phase 20B.1 platform mount migration');

const module = await import('../js/modules/pressure-holding/index.js');
assert.equal(typeof module.default.mount, 'function', 'platform module exposes a mount function');
assert.equal(module.default.config.id, 'pressure-holding', 'module identity is preserved');

console.log('pressure-holding phase20b1 platform-mount regression ok');
