import fs from 'node:fs';
import assert from 'node:assert/strict';

const report = JSON.parse(fs.readFileSync('dead-code-duplicate-audit-phase30b.json', 'utf8'));

assert.equal(report.phase, '30B');
assert.ok(report.summary.sourceFiles > 100, 'expected full source inventory');
assert.ok(report.summary.runtimeFiles > 50, 'expected runtime JS inventory');
assert.ok(Array.isArray(report.findings), 'expected findings array');
assert.ok(report.findings.some((item) => item.id === 'P30B-F2'), 'expected runtime dead-code finding');
assert.ok(report.findings.some((item) => item.id === 'P30B-F4'), 'expected duplicate finding');
assert.equal(report.policy.deleteAutomatically, false, '30B must be detection-only');
assert.equal(report.summary.unresolvedRelativeImports, 0, 'static import graph should not contain unresolved relative imports');
assert.ok(report.score >= 4.0, 'cleanup detection baseline should remain acceptable');

console.log('Phase 30B dead-code/duplicate audit test passed');
