import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync('node', ['scripts/audit-controlled-cleanup-phase30d.mjs'], { stdio: 'inherit' });
const result = JSON.parse(fs.readFileSync('docs/audits/json/controlled-cleanup-audit-phase30d.json', 'utf8'));

assert.equal(result.phase, '30D');
assert.ok(result.score >= 4.8, `Expected 30D score >= 4.8, got ${result.score}`);
assert.equal(result.counts.misplacedRootPhaseDocs, 0);
assert.equal(result.counts.misplacedRootAuditJson, 0);
assert.equal(result.counts.topLevelDocsPhaseDocs, 0);
assert.equal(result.counts.missingPackageScriptTargets, 0);
assert.equal(result.counts.missingQualityGateTargets, 0);
assert.equal(result.findings.filter((finding) => finding.severity === 'P0').length, 0);
assert.equal(result.findings.filter((finding) => finding.severity === 'P1').length, 0);

console.log('Phase 30D controlled cleanup test passed');
