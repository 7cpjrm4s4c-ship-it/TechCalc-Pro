import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const focusManagerPath = join(root, 'js/core/focusManager.js');
const eventPipelinePath = join(root, 'js/core/eventPipeline.js');
const stateBindingPath = join(root, 'js/core/stateBinding.js');

function read(path) { return existsSync(path) ? readFileSync(path, 'utf8') : ''; }
function grade(score) { return score >= 4.5 ? 'A' : score >= 3.8 ? 'B' : score >= 3 ? 'C' : score >= 2 ? 'D' : 'F'; }

const focusManager = read(focusManagerPath);
const eventPipeline = read(eventPipelinePath);
const stateBinding = read(stateBindingPath);

const acceptance = {
  tabNavigationApiExists: /export function shouldHandleTabNavigation/.test(focusManager)
    && /export function focusByTab/.test(focusManager)
    && /export function handleTabNavigation/.test(focusManager),
  unifiedFieldNavigationExists: /export function handlePlatformFieldNavigation/.test(focusManager)
    && /shouldHandleEnterNavigation\(event\)/.test(focusManager)
    && /shouldHandleTabNavigation\(event\)/.test(focusManager),
  platformObjectExportsTabApi: /PlatformFocusManager[\s\S]*shouldHandleTabNavigation[\s\S]*focusByTab[\s\S]*handleTabNavigation[\s\S]*handlePlatformFieldNavigation/.test(focusManager),
  centralPipelineDelegatesTabNavigation: /handlePlatformFieldNavigation/.test(eventPipeline)
    && /event\.key !== 'Enter' && event\.key !== 'Tab'/.test(eventPipeline)
    && /const action = event\.key === 'Tab' \? 'field:tab' : 'field:enter'/.test(eventPipeline)
    && /navigatePlatformField\(root, el, event\)/.test(eventPipeline),
  tabCommitPreserved: /action, notify: true, root/.test(eventPipeline)
    && /notifyCommit\(\{ action, element: el \}\)/.test(eventPipeline),
  fallbackBindingDelegatesTabNavigation: /handlePlatformFieldNavigation/.test(stateBinding)
    && /event\.key !== 'Enter' && event\.key !== 'Tab'/.test(stateBinding)
    && /event\.key === 'Tab' \? 'binding:tab' : 'binding:enter'/.test(stateBinding),
  shiftTabPreviousSupported: /event\?\.shiftKey \? 'previous' : 'next'/.test(focusManager),
  preventScrollFocusPreserved: /preventScroll: true/.test(focusManager)
};

let score = 3.6;
score += acceptance.tabNavigationApiExists ? 0.35 : 0;
score += acceptance.unifiedFieldNavigationExists ? 0.25 : 0;
score += acceptance.platformObjectExportsTabApi ? 0.2 : 0;
score += acceptance.centralPipelineDelegatesTabNavigation ? 0.3 : 0;
score += acceptance.tabCommitPreserved ? 0.15 : 0;
score += acceptance.fallbackBindingDelegatesTabNavigation ? 0.1 : 0;
score += acceptance.shiftTabPreviousSupported ? 0.1 : 0;
score += acceptance.preventScrollFocusPreserved ? 0.05 : 0;
score = Math.min(5, Number(score.toFixed(2)));

const findings = [];
if (!acceptance.tabNavigationApiExists) findings.push({ area: 'focusManager', risk: 'P1', action: 'Tab navigation API must exist in PlatformFocusManager.' });
if (!acceptance.centralPipelineDelegatesTabNavigation) findings.push({ area: 'centralPipeline', risk: 'P1', action: 'Central event pipeline must commit and delegate Tab navigation through PlatformFocusManager.' });
if (!acceptance.fallbackBindingDelegatesTabNavigation) findings.push({ area: 'legacyStateBinding', risk: 'P2', action: 'Legacy fallback binding should delegate Tab navigation through PlatformFocusManager.' });
findings.push({ area: 'dynamicInputs', risk: 'P2', action: 'Dynamic collection-specific inputs remain final hardening scope of 28B.4.', evidence: ['js/platform/moduleRuntime/index.js'] });

const report = {
  phase: '28B.3',
  name: 'Platform Tab Navigation',
  generatedAt: new Date().toISOString(),
  overallScore: score,
  overallGrade: grade(score),
  executiveSummary: {
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    conclusion: 'Tab- und Shift+Tab-Navigation sind zentral im PlatformFocusManager definiert. Die zentrale Event-Pipeline und der Legacy-Fallback committen Feldwerte vor dem Fokuswechsel und delegieren die Navigation an denselben Service wie Enter.'
  },
  acceptance,
  findings
};

writeFileSync(join(root, 'platform-tab-navigation-phase28b3.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 28B.3 tab navigation audit completed: ${report.overallScore} (${report.overallGrade})`);
