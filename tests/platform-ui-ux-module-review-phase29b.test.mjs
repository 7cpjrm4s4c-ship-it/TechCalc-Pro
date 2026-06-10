import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'platform-ui-ux-module-review-phase29b.json');
assert.equal(fs.existsSync(reportPath), true, '29B Module Review Report fehlt. Bitte npm run audit:ui-ux-module-review ausfuehren.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '29B');
assert.ok(report.score >= 4.0, `Score zu niedrig: ${report.score}`);
assert.equal(report.findings.p0.length, 0, 'P0 Findings sind in 29B nicht akzeptabel.');
assert.ok(report.summary.modules >= 11, 'Mindestens 11 Module muessen geprueft werden.');
assert.equal(report.summary.axes, 10, '29B muss die 10 Achsen aus 29A verwenden.');
assert.equal(report.summary.totalChecks, report.summary.modules * report.summary.axes);
assert.ok(report.summary.pass > report.summary.review, 'Mehr Pass- als Review-Checks erwartet.');

for (const moduleName of ['rainwater', 'wastewater', 'hx-diagram', 'drinking-water']) {
  const entry = report.moduleReviews.find(item => item.module === moduleName);
  assert.ok(entry, `${moduleName} fehlt in 29B.`);
  assert.ok(['high', 'reference'].includes(entry.risk), `${moduleName} muss high/reference bleiben.`);
  assert.equal(entry.checks.length, report.summary.axes, `${moduleName} hat unvollstaendige Checks.`);
}

for (const moduleName of ['buffer-storage', 'heat-recovery', 'hx-diagram']) {
  const entry = report.moduleReviews.find(item => item.module === moduleName);
  assert.ok(entry, `${moduleName} fehlt als Referenzmodul.`);
  assert.equal(entry.risk, 'reference', `${moduleName} muss Referenzstatus haben.`);
}

assert.ok(Array.isArray(report.remediationBacklog), 'Remediation Backlog fehlt.');
assert.ok(report.remediationBacklog.length >= 3, 'Remediation Backlog ist zu duenn.');
assert.equal(report.nextPhase.id, '29C');

console.log('Phase 29B UI/UX Module Review Test bestanden.');
