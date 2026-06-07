import fs from 'node:fs';
import assert from 'node:assert/strict';

const index = fs.readFileSync('js/modules/unit-converter/index.js', 'utf8');
const config = fs.readFileSync('js/modules/unit-converter/config.js', 'utf8');

assert.match(index, /createPlatformModule\s*\(/, 'unit-converter must use createPlatformModule');
assert.doesNotMatch(index, /mountModule\s*\(/, 'unit-converter must not call legacy mountModule');
assert.match(config, /phase-22b1-platform-mount/, 'migrationStatus must include phase-22b1-platform-mount');
assert.match(config, /phase-22b1-render-fix/, 'migrationStatus must include phase-22b1-render-fix');
assert.match(index, /isDynamicAction:\s*\(\)\s*=>\s*false/, 'custom view must force full renders until unit dynamic renderer exists');

const module = await import('../js/modules/unit-converter/index.js');
assert.equal(typeof module.default.mount, 'function', 'platform module must expose mount function');
assert.equal(module.default.config.id, 'unit-converter', 'module id must remain stable');
