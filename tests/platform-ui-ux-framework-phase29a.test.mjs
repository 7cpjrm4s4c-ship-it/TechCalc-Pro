import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'platform-ui-ux-audit-framework-phase29a.json');
assert.equal(fs.existsSync(reportPath), true, '29A Audit Framework Report fehlt. Bitte npm run audit:ui-ux-framework ausfuehren.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '29A');
assert.ok(report.score >= 4.5, `Score zu niedrig: ${report.score}`);
assert.equal(report.findings.p0.length, 0, 'P0 Findings im Audit Framework sind nicht erlaubt.');
assert.ok(report.summary.modules >= 11, 'Es muessen mindestens 11 Module in der Matrix enthalten sein.');
assert.equal(report.summary.axes, 10, 'Der 29A Katalog muss 10 UI/UX Pruefachsen enthalten.');
assert.equal(report.summary.totalPlannedChecks, report.summary.modules * report.summary.axes);

const requiredAxes = [
  'input-confirmation',
  'enter-tab-navigation',
  'focus-restore',
  'scroll-stability',
  'saved-records',
  'live-rendering',
  'unit-switching',
  'result-rendering',
  'responsive-layout',
  'error-reset-states'
];
assert.deepEqual(report.axes.map(axis => axis.id), requiredAxes);

for (const moduleName of ['rainwater', 'wastewater', 'hx-diagram', 'drinking-water']) {
  const entry = report.moduleMatrix.find(item => item.module === moduleName);
  assert.ok(entry, `${moduleName} fehlt in der UI/UX Matrix.`);
  assert.ok(['high', 'reference'].includes(entry.risk), `${moduleName} muss als high/reference klassifiziert sein.`);
  assert.equal(entry.checks.length, requiredAxes.length, `${moduleName} hat eine unvollstaendige Checkliste.`);
}

for (const file of [
  'js/core/scrollManager.js',
  'js/core/focusManager.js',
  'js/core/eventManager.js',
  'platform-verification-phase28d.json'
]) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `${file} fehlt als 29A Voraussetzung.`);
}

console.log('Phase 29A UI/UX Audit Framework Test bestanden.');
