import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'tests/e2e/phase37b-runtime-smoke.spec.mjs',
  'tests/e2e/phase46d-mixed-air-workflow.spec.mjs',
  'tests/e2e/module-layout-contract.spec.mjs',
  'tests/e2e/flooding-verification-visual-regression.spec.mjs',
  'tests/fixtures/legacy-1.3.2-wrg-mixed-air.tcproj'
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}

const smoke = fs.readFileSync(path.join(root, 'tests/e2e/phase37b-runtime-smoke.spec.mjs'), 'utf8');
if (!smoke.includes("'mixed-air'")) failures.push('phase37b runtime smoke does not include mixed-air route');
if (!/ensureAppBooted\(page\)[\s\S]*window\.location\.hash/.test(smoke)) failures.push('phase37b runtime smoke must navigate only after normal app boot');
if (/page\.goto\(`?\.\/?#\//.test(smoke)) failures.push('phase37b runtime smoke must not use direct hash boot');

const mixedAirSpec = fs.readFileSync(path.join(root, 'tests/e2e/phase46d-mixed-air-workflow.spec.mjs'), 'utf8');
const requiredPatterns = [
  [/mixed-air/i, 'mixed-air route coverage'],
  [/ensureAppBooted\(page\)/, 'preferred-route boot before module navigation'],
  [/window\.location\.hash = `#\/\$\{id\}`/, 'post-boot hash navigation'],
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
if (/page\.goto\(`?\.\/?#\//.test(mixedAirSpec)) failures.push('mixed-air workflow must not use direct hash boot');

const floodingVisualSpec = fs.readFileSync(path.join(root, 'tests/e2e/flooding-verification-visual-regression.spec.mjs'), 'utf8');
if (!/mobileQuickAccess:\s*\['flooding-verification'/.test(floodingVisualSpec) || !/page\.goto\('\/'\)/.test(floodingVisualSpec)) {
  failures.push('flooding visual regression must select flooding-verification through the preferred start-module contract');
}
if (/page\.goto\('\/#\/flooding-verification'\)/.test(floodingVisualSpec)) failures.push('flooding visual regression must not use direct hash boot');

const layoutSpec = fs.readFileSync(path.join(root, 'tests/e2e/module-layout-contract.spec.mjs'), 'utf8');
const layoutPatterns = [
  [/discoverModuleIds/, 'all-module discovery'],
  [/viewportWidth\s*>?=\s*1024/, 'desktop breakpoint assertion'],
  [/tc-module-root-stack/, 'root-stack assertion'],
  [/tc-module-column/, 'independent column assertion'],
  [/stackViolations/, 'central spacing assertion'],
  [/documentOverflow/, 'document overflow assertion'],
  [/mutateFirstEditableControl/, 'post-calculation layout assertion']
];
for (const [pattern, label] of layoutPatterns) {
  if (!pattern.test(layoutSpec)) failures.push(`module layout regression missing ${label}`);
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
