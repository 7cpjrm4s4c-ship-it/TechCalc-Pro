import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-platform-convergence-phase37a.mjs'], { stdio: 'inherit' });

const report = JSON.parse(readFileSync('docs/audits/json/platform-convergence-audit-phase37a.json', 'utf8'));
const p1Findings = report.riskRegister.filter(item => item.priority === 'P1');
assert.equal(p1Findings.length, 0, 'Phase 37A.1 must close all P1 convergence findings');

const rainwater = report.modules.find(item => item.module === 'rainwater');
assert.ok(rainwater, 'rainwater must be audited');
assert.equal(rainwater.metrics.nonControllerAddEventListeners, 0, 'rainwater drain precommit must be owned by controller.js');
assert.equal(rainwater.findings.some(item => item.area === 'event-boundary'), false, 'rainwater must not have an event-boundary finding');

const rainwaterController = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const rainwaterIndex = readFileSync('js/modules/rainwater/index.js', 'utf8');
assert.match(rainwaterController, /export function bindRainwaterController/, 'rainwater controller must export bindRainwaterController');
assert.match(rainwaterController, /rainwater:drainSize:precommit/, 'drain precommit action must be preserved');
assert.doesNotMatch(rainwaterIndex, /addEventListener\s*\(/, 'rainwater index.js must not bind DOM listeners directly');

const unitConverter = report.modules.find(item => item.module === 'unit-converter');
assert.ok(unitConverter, 'unit-converter must be audited');
assert.equal(unitConverter.findings.some(item => item.area === 'module-contract'), false, 'unit-converter must satisfy module file contract');
assert.equal(unitConverter.files.includes('controller.js'), true, 'unit-converter must include controller.js');

console.log('phase37a1 p1 cleanup test ok');
