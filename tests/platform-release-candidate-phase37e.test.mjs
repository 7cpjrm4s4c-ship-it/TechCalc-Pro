import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const auditPath = 'docs/audits/json/release-candidate-phase37e.json';
assert.equal(existsSync(auditPath), true, 'Phase 37E audit report must exist.');
const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
assert.equal(audit.phase, '37E');
assert.equal(audit.status, 'pass');
assert.equal(audit.checks.every(check => check.pass), true, 'all Phase 37E checks must pass');

const releaseNotes = readFileSync('RELEASE_NOTES.md', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.match(releaseNotes, new RegExp(`Version ${pkg.version.replaceAll('.', '\\.')}`));
if (!pkg.version.includes('-dev.') && !pkg.version.includes('-rc.')) assert.match(releaseNotes, /Final Release/);

console.log('Phase 37E release candidate guard passed with current public release notes.');
