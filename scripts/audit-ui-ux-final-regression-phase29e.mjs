import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const framework = readJson('platform-ui-ux-audit-framework-phase29a.json');
const review = readJson('platform-ui-ux-module-review-phase29b.json');
const batch1 = readJson('platform-ui-ux-bugfix-batch1-phase29c.json');
const batch2 = readJson('platform-ui-ux-bugfix-batch2-phase29d.json');

const focusManager = read('js/core/focusManager.js');
const scrollManager = read('js/core/scrollManager.js');
const moduleRuntime = read('js/platform/moduleRuntime/index.js');
const eventManager = exists('js/core/eventManager.js') ? read('js/core/eventManager.js') : '';

const modules = (framework.moduleMatrix || []).map(item => item.module).sort();
const axes = (framework.axes || []).map(item => item.id).sort();
const referenceModules = framework.summary?.referenceModules || [];
const highRiskModules = framework.summary?.highRiskModules || [];

const checks = [
  {
    id: '29E-UX-001',
    area: 'audit-framework-integrity',
    severity: 'P0',
    title: '29A audit framework covers all planned modules and UI/UX axes',
    pass: framework.summary?.modules === 11
      && framework.summary?.axes === 10
      && framework.summary?.totalPlannedChecks === 110
      && (framework.moduleMatrix || []).length === 11
      && (framework.axes || []).length === 10,
    evidence: {
      modules: framework.summary?.modules,
      axes: framework.summary?.axes,
      plannedChecks: framework.summary?.totalPlannedChecks
    }
  },
  {
    id: '29E-UX-002',
    area: 'module-review-baseline',
    severity: 'P0',
    title: '29B module review baseline remains complete and has no P0 findings',
    pass: review.summary?.modules === 11
      && review.summary?.totalChecks === 110
      && review.summary?.p0 === 0
      && Array.isArray(review.moduleReviews)
      && review.moduleReviews.length === 11,
    evidence: {
      modules: review.summary?.modules,
      checks: review.summary?.totalChecks,
      p0: review.summary?.p0
    }
  },
  {
    id: '29E-UX-003',
    area: 'p1-closure',
    severity: 'P1',
    title: 'All 29B P1 UI/UX findings are closed by 29C',
    pass: review.summary?.p1 === 9
      && batch1.summary?.p1Open === 0
      && batch1.summary?.p1Closed >= 6
      && batch1.checks?.every(check => check.pass),
    evidence: {
      originalP1: review.summary?.p1,
      p1Open: batch1.summary?.p1Open,
      p1Closed: batch1.summary?.p1Closed
    }
  },
  {
    id: '29E-UX-004',
    area: 'p2-closure',
    severity: 'P2',
    title: 'All 29B P2 UI/UX findings are closed by 29D',
    pass: review.summary?.p2 === 22
      && batch2.summary?.p2Reviewed === 22
      && batch2.summary?.p2Open === 0
      && batch2.summary?.p2Closed === 22
      && batch2.checks?.every(check => check.pass),
    evidence: {
      originalP2: review.summary?.p2,
      p2Reviewed: batch2.summary?.p2Reviewed,
      p2Closed: batch2.summary?.p2Closed,
      p2Open: batch2.summary?.p2Open
    }
  },
  {
    id: '29E-UX-005',
    area: 'focus-navigation-regression',
    severity: 'P1',
    title: 'PlatformFocusManager still owns Enter/Tab navigation and focus/caret restore',
    pass: /handlePlatformFieldNavigation/.test(focusManager)
      && /handleEnterNavigation/.test(focusManager)
      && /handleTabNavigation/.test(focusManager)
      && /captureActiveField/.test(focusManager)
      && /restoreCapturedField/.test(focusManager)
      && /preserveFocusDuring/.test(focusManager)
      && /preventScroll:\s*true/.test(focusManager),
    evidence: ['handlePlatformFieldNavigation', 'handleEnterNavigation', 'handleTabNavigation', 'preserveFocusDuring', 'preventScroll']
  },
  {
    id: '29E-UX-006',
    area: 'scroll-stability-regression',
    severity: 'P1',
    title: 'PlatformScrollManager still owns scroll protection for render, saved records and module switches',
    pass: /runWithoutScrollJump/.test(scrollManager)
      && /preserveSavedRecordMutation/.test(scrollManager)
      && /preserveModuleSwitchScroll/.test(scrollManager)
      && /freeze/.test(scrollManager)
      && /unfreeze/.test(scrollManager),
    evidence: ['runWithoutScrollJump', 'preserveSavedRecordMutation', 'preserveModuleSwitchScroll', 'freeze', 'unfreeze']
  },
  {
    id: '29E-UX-007',
    area: 'dynamic-render-regression',
    severity: 'P1',
    title: 'Module runtime still combines scroll and focus preservation during dynamic UI updates',
    pass: /preservePlatformUx/.test(moduleRuntime)
      && /PlatformFocusManager\.preserveFocusDuring/.test(moduleRuntime)
      && /PlatformScrollManager\.runWithoutScrollJump/.test(moduleRuntime),
    evidence: ['preservePlatformUx', 'PlatformFocusManager.preserveFocusDuring', 'PlatformScrollManager.runWithoutScrollJump']
  },
  {
    id: '29E-UX-008',
    area: 'event-cleanup-regression',
    severity: 'P2',
    title: 'Event cleanup service remains available for UI/UX listeners',
    pass: /createEventScope/.test(eventManager)
      && /addEventListener/.test(eventManager)
      && /cleanup/.test(eventManager),
    evidence: ['createEventScope', 'addEventListener', 'cleanup']
  },
  {
    id: '29E-UX-009',
    area: 'high-risk-module-coverage',
    severity: 'P1',
    title: 'High-risk UI/UX modules remain part of the final regression scope',
    pass: ['drinking-water', 'hx-diagram', 'rainwater', 'wastewater'].every(module => highRiskModules.includes(module)),
    evidence: { highRiskModules }
  },
  {
    id: '29E-UX-010',
    area: 'reference-module-coverage',
    severity: 'P2',
    title: 'Reference modules remain part of the final regression baseline',
    pass: ['buffer-storage', 'heat-recovery', 'hx-diagram'].every(module => referenceModules.includes(module)),
    evidence: { referenceModules }
  }
];

const passed = checks.filter(check => check.pass).length;
const failed = checks.length - passed;
const score = Number((passed / checks.length * 5).toFixed(2));
const p0Open = checks.filter(check => check.severity === 'P0' && !check.pass).length;
const p1Open = checks.filter(check => check.severity === 'P1' && !check.pass).length;
const p2Open = checks.filter(check => check.severity === 'P2' && !check.pass).length;

const report = {
  phase: '29E',
  title: 'Final UI/UX Regression Baseline',
  generatedAt: new Date().toISOString(),
  score,
  grade: failed === 0 ? 'A' : score >= 4 ? 'B' : 'C',
  summary: {
    modules: modules.length,
    axes: axes.length,
    plannedChecks: framework.summary?.totalPlannedChecks,
    regressionChecks: checks.length,
    passed,
    failed,
    p0Open,
    p1Open,
    p2Open,
    originalFindings: {
      p0: review.summary?.p0,
      p1: review.summary?.p1,
      p2: review.summary?.p2,
      p3: review.summary?.p3
    },
    closedFindings: {
      p1: batch1.summary?.p1Open === 0 ? review.summary?.p1 : 0,
      p2: batch2.summary?.p2Closed ?? 0
    },
    highRiskModules,
    referenceModules
  },
  modules,
  axes,
  regressionMatrix: checks,
  acceptanceCriteria: [
    '29A audit framework remains complete for 11 modules and 10 UI/UX axes.',
    '29B review has no P0 findings and remains the baseline for 29C/29D closure.',
    '29C closes all P1 findings from the bugfix round.',
    '29D closes all P2 findings from the bugfix round.',
    'Scroll, focus, dynamic-render and event cleanup infrastructure remain present after all fixes.'
  ],
  releaseReadiness: failed === 0 ? 'UX bugfix round closed. Proceed to Phase 30 cleanup and structure audit.' : 'Resolve failed regression checks before Phase 30.',
  nextPhase: {
    id: '30A',
    title: 'Structure/Cleanup Audit',
    recommendation: failed === 0
      ? 'Start cleanup audit for duplicates, dead code, stale phase artifacts and documentation structure.'
      : 'Do not start cleanup until final UI/UX regression is green.'
  }
};

fs.writeFileSync(path.join(root, 'platform-ui-ux-final-regression-phase29e.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 29E Final UI/UX Regression: ${score}/5 (${report.grade}), failed=${failed}, P0=${p0Open}, P1=${p1Open}, P2=${p2Open}`);
if (failed) process.exitCode = 1;
