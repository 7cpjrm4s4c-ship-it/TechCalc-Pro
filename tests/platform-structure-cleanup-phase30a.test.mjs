import fs from 'node:fs';
import assert from 'node:assert/strict';

const report = JSON.parse(fs.readFileSync('structure-cleanup-audit-phase30a.json', 'utf8'));

assert.equal(report.phase, '30A');
assert.ok(report.summary.modules >= 10, 'expected migrated module inventory');
assert.ok(report.summary.rootAuditJsonArtifacts > 20, 'expected root audit artifacts to be inventoried');
assert.ok(report.summary.docsFiles > 50, 'expected phase documentation inventory');
assert.ok(Array.isArray(report.recommendations));
assert.ok(report.recommendations.some((item) => item.priority === 'P1'), 'expected at least one P1 cleanup recommendation');
assert.ok(report.score >= 4.0, 'cleanup audit baseline should be acceptable');

console.log('Phase 30A structure cleanup audit test passed');
