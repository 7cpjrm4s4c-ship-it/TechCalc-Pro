import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-documentation-structure-phase30c.mjs'], { stdio: 'pipe' });
const audit = JSON.parse(fs.readFileSync('docs/audits/json/documentation-structure-audit-phase30c.json', 'utf8'));

assert.equal(audit.phase, '30C');
assert.equal(audit.counts.misplacedRootDocs, 0, 'phase/release docs must not remain in root');
assert.equal(audit.counts.misplacedRootAuditJson, 0, 'audit JSON files must not remain in root');
assert.ok(audit.counts.phaseDocs >= 100, 'phase documentation should be grouped under docs/phases');
assert.ok(audit.counts.auditJson >= 30, 'audit JSON artefacts should be archived under docs/audits/json');
assert.equal(audit.findings.filter((f) => f.severity === 'P0').length, 0);
assert.equal(audit.findings.filter((f) => f.severity === 'P1').length, 0);

console.log('Phase 30C documentation structure test passed.');
