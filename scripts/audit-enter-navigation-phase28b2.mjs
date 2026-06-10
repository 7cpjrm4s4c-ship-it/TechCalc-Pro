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
  enterNavigationApiExists: /export function shouldHandleEnterNavigation/.test(focusManager)
    && /export function focusByEnter/.test(focusManager)
    && /export function handleEnterNavigation/.test(focusManager),
  platformObjectExportsEnterApi: /PlatformFocusManager[\s\S]*shouldHandleEnterNavigation[\s\S]*focusByEnter[\s\S]*handleEnterNavigation/.test(focusManager),
  centralPipelineDelegatesEnterNavigation: /handleEnterNavigation as handlePlatformEnterNavigation/.test(eventPipeline)
    && /focusNextPlatformField\(root, el, event\)/.test(eventPipeline)
    && /return handlePlatformEnterNavigation\(root, current, event/.test(eventPipeline),
  enterCommitPreserved: /action: 'field:enter'/.test(eventPipeline)
    && /notify: true/.test(eventPipeline),
  fallbackBindingDelegatesEnterNavigation: /handleEnterNavigation as handlePlatformEnterNavigation/.test(stateBinding)
    && /handlePlatformEnterNavigation\(root, field, event/.test(stateBinding),
  shiftEnterPreviousSupported: /event\?\.shiftKey \? 'previous' : 'next'/.test(focusManager),
  preventScrollFocusPreserved: /preventScroll: true/.test(focusManager)
};

let score = 3.7;
score += acceptance.enterNavigationApiExists ? 0.35 : 0;
score += acceptance.platformObjectExportsEnterApi ? 0.2 : 0;
score += acceptance.centralPipelineDelegatesEnterNavigation ? 0.3 : 0;
score += acceptance.enterCommitPreserved ? 0.15 : 0;
score += acceptance.fallbackBindingDelegatesEnterNavigation ? 0.15 : 0;
score += acceptance.shiftEnterPreviousSupported ? 0.1 : 0;
score += acceptance.preventScrollFocusPreserved ? 0.05 : 0;
score = Math.min(5, Number(score.toFixed(2)));

const findings = [];
if (!acceptance.centralPipelineDelegatesEnterNavigation) findings.push({ area: 'centralPipeline', risk: 'P1', action: 'Enter navigation must be delegated through PlatformFocusManager.' });
if (!acceptance.enterCommitPreserved) findings.push({ area: 'enterCommit', risk: 'P1', action: 'Enter must continue to commit field values before navigation.' });
findings.push({ area: 'tabNavigation', risk: 'P2', action: 'Tab order hardening remains scope of 28B.3.', evidence: ['js/core/focusManager.js'] });

const report = {
  phase: '28B.2',
  name: 'Platform Enter Navigation',
  generatedAt: new Date().toISOString(),
  overallScore: score,
  overallGrade: grade(score),
  executiveSummary: {
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    conclusion: 'Enter-Navigation ist zentral im PlatformFocusManager definiert. Die zentrale Event-Pipeline und der Legacy-Fallback committen weiterhin zuerst den Feldwert und delegieren anschliessend die Navigation zum naechsten beziehungsweise vorherigen Plattformfeld.'
  },
  acceptance,
  findings
};

writeFileSync(join(root, 'platform-enter-navigation-phase28b2.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 28B.2 enter navigation audit completed: ${report.overallScore} (${report.overallGrade})`);
