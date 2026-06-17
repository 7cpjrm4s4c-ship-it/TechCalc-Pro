import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(file));
    else out.push(file);
  }
  return out;
}

const files = walk('docs/phases').filter((file) => file.endsWith('.md'));
const nested = files.filter((file) => path.relative('docs/phases', file).includes(path.sep));

assert.ok(existsSync('docs/phases/phase-37.md'), 'Phase 37 consolidated documentation must exist');
assert.ok(existsSync('docs/phases/phase-12.md'), 'Phase 12 consolidated documentation must exist');
assert.ok(existsSync('docs/phases/phase-16.md'), 'Phase 16 consolidated documentation must exist');
assert.equal(nested.length, 0, 'phase docs must no longer be nested by subphase directories');
assert.ok(files.length <= 30, `phase docs should be consolidated to <= 30 files, got ${files.length}`);

const phase37 = readFileSync('docs/phases/phase-37.md', 'utf8');
assert.match(phase37, /Phase 37B4 Documentation Consolidation/, 'Phase 37B.4 closure must be documented');
assert.match(phase37, /145 markdown files to 25 markdown files/, 'documentation reduction must be recorded');

const phase12 = readFileSync('docs/phases/phase-12.md', 'utf8');
assert.match(phase12, /Basis: Phase 12H/, 'legacy doc contract text must survive consolidation');

const phase16 = readFileSync('docs/phases/phase-16.md', 'utf8');
assert.match(phase16, /snapshot\(current, result\)/, 'saved-record mapping contract must survive consolidation');

console.log('phase37b4 documentation consolidation regression ok');
