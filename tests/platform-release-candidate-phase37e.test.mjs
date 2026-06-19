import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const auditPath = 'docs/audits/json/release-candidate-phase37e.json';
assert.equal(existsSync(auditPath), true, 'Phase 37E audit report must exist.');
const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
assert.equal(audit.phase, '37E');
assert.equal(audit.status, 'pass');
assert.equal(audit.checks.every(check => check.pass), true, 'all Phase 37E checks must pass');

const releaseNotes = readFileSync('RELEASE_NOTES.md', 'utf8');
assert.match(releaseNotes, /Phase 37E/);
assert.match(releaseNotes, /RC Closure/);

console.log('Phase 37E release candidate guard passed.');
