import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync('node', ['scripts/audit-final-baseline-phase30e.mjs'], { stdio: 'inherit' });
const result = JSON.parse(fs.readFileSync('docs/audits/json/final-baseline-phase30e.json', 'utf8'));

assert.equal(result.phase, '30E');
assert.ok(result.score >= 4.8, `Expected 30E score >= 4.8, got ${result.score}`);
assert.equal(result.validation.importCheck.status, 'passed');
assert.equal(result.counts.misplacedRootPhaseDocs, 0);
assert.equal(result.counts.misplacedRootAuditJson, 0);
assert.equal(result.counts.missingPackageScriptTargets, 0);
assert.equal(result.findings.filter((finding) => finding.severity === 'P0').length, 0);
assert.equal(result.findings.filter((finding) => finding.severity === 'P1').length, 0);

console.log('Phase 30E final baseline test passed');
