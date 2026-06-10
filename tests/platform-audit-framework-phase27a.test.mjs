import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

assert.equal(existsSync('docs/PHASE_27A_PLATFORM_AUDIT_FRAMEWORK.md'), true, 'Phase 27A framework documentation must exist');
assert.equal(existsSync('platform-audit-framework-phase27a.json'), true, 'Phase 27A framework JSON must exist');

const framework = JSON.parse(readFileSync('platform-audit-framework-phase27a.json', 'utf8'));
assert.equal(framework.phase, '27A');
assert.ok(framework.modules.includes('hx-diagram'));
assert.ok(framework.modules.includes('heat-recovery'));
assert.ok(framework.modules.includes('buffer-storage'));
assert.ok(framework.dimensions.includes('renderPipeline'));
assert.ok(framework.dimensions.includes('savedRecords'));
assert.ok(framework.dimensions.includes('diagramRenderer'));

execFileSync('node', ['scripts/audit-platform-framework-phase27a.mjs'], { stdio: 'pipe' });
assert.equal(existsSync('platform-audit-baseline-phase27a.json'), true, 'Phase 27A baseline audit output must be generated');

const baseline = JSON.parse(readFileSync('platform-audit-baseline-phase27a.json', 'utf8'));
assert.equal(baseline.phase, '27A');
assert.equal(baseline.frameworkPresent, true);
assert.ok(baseline.modules.length >= 10);
assert.ok(baseline.modules.every(entry => Number.isFinite(entry.average)));

console.log('platform audit framework phase27a ok');
