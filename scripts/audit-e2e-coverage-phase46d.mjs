import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'tests/e2e/phase37b-runtime-smoke.spec.mjs',
  'tests/e2e/phase46d-mixed-air-workflow.spec.mjs',
  'tests/fixtures/legacy-1.3.2-wrg-mixed-air.tcproj'
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}

const smoke = fs.readFileSync(path.join(root, 'tests/e2e/phase37b-runtime-smoke.spec.mjs'), 'utf8');
if (!smoke.includes("'mixed-air'")) failures.push('phase37b runtime smoke does not include mixed-air route');

const mixedAirSpec = fs.readFileSync(path.join(root, 'tests/e2e/phase46d-mixed-air-workflow.spec.mjs'), 'utf8');
const requiredPatterns = [
  [/mixed-air/i, 'mixed-air route coverage'],
  [/legacy-1\.3\.2-wrg-mixed-air\.tcproj/, 'legacy project fixture import'],
  [/Mischluft Bestand/, 'legacy mixed-air saved record assertion'],
  [/WRG Bestand/, 'legacy heat-recovery saved record assertion'],
  [/saveProjectButton/, 'project export coverage'],
  [/exportPdfButton/, 'PDF export coverage'],
  [/page\.waitForEvent\('download'\)/, 'download artifact assertion']
];
for (const [pattern, label] of requiredPatterns) {
  if (!pattern.test(mixedAirSpec)) failures.push(`missing ${label}`);
}

const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/legacy-1.3.2-wrg-mixed-air.tcproj'), 'utf8'));
const heatRecovery = fixture.modules?.['heat-recovery']?.state;
if (!heatRecovery?.savedRltDevices?.some(item => item.name === 'Mischluft Bestand')) failures.push('legacy fixture lacks mixed-air record in heat-recovery store');
if (!heatRecovery?.savedRltDevices?.some(item => item.name === 'WRG Bestand')) failures.push('legacy fixture lacks heat-recovery record');

if (failures.length) {
  console.error('Phase 46D E2E coverage audit failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Phase 46D E2E coverage audit ok');
