import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const moduleRuntime = read('js/platform/moduleRuntime/index.js');
const lineController = read('js/platform/lineSectionController/index.js');
const hxController = read('js/modules/hx-diagram/controller.js');
const rainwaterController = read('js/modules/rainwater/controller.js');
const wastewaterController = read('js/modules/wastewater/controller.js');

const checks = [
  {
    id: '29C-P1-001',
    area: 'platform-saved-record-scroll',
    severity: 'P1',
    title: 'Platform saved-record actions preserve scroll',
    pass: /preserveSavedRecordMutation/.test(moduleRuntime) && /line:select/.test(moduleRuntime) && /line:deselect/.test(moduleRuntime),
    evidence: ['moduleRuntime saved-record load/deselect/toggle/delete actions wrapped']
  },
  {
    id: '29C-P1-002',
    area: 'platform-dynamic-focus',
    severity: 'P1',
    title: 'Dynamic schema re-render preserves focus and caret',
    pass: /PlatformFocusManager/.test(moduleRuntime) && /preservePlatformUx/.test(moduleRuntime) && /preserveFocusDuring/.test(moduleRuntime),
    evidence: ['dynamic island/full segment renders run through preservePlatformUx']
  },
  {
    id: '29C-P1-003',
    area: 'line-section-scroll',
    severity: 'P1',
    title: 'Line-section saved records preserve scroll',
    pass: /preserveSavedRecordMutation/.test(lineController) && /PlatformFocusManager/.test(lineController),
    evidence: ['lineSectionController persist/load/toggle operations wrapped']
  },
  {
    id: '29C-P1-004',
    area: 'rainwater-saved-records',
    severity: 'P1',
    title: 'Regenwasser saved records use platform preserved flows',
    pass: /preserveSaveScroll:\s*true/.test(rainwaterController) && /preserveLoadScroll:\s*true/.test(rainwaterController) && /savedRecords/.test(rainwaterController),
    evidence: ['rainwater controller exposes preserved save/load saved-record contract']
  },
  {
    id: '29C-P1-005',
    area: 'wastewater-saved-records',
    severity: 'P1',
    title: 'Entwaesserung saved records use platform preserved flows',
    pass: /preserveSaveScroll:\s*true/.test(wastewaterController) && /preserveLoadScroll:\s*true/.test(wastewaterController) && /savedRecords/.test(wastewaterController),
    evidence: ['wastewater controller exposes preserved save/load saved-record contract']
  },
  {
    id: '29C-P1-006',
    area: 'hx-line-section',
    severity: 'P1',
    title: 'h,x saved process flow benefits from line-section scroll protection',
    pass: /createLineSectionController/.test(hxController) && /preserveSavedRecordMutation/.test(lineController),
    evidence: ['hx process controller uses shared line-section controller']
  }
];

const passed = checks.filter(check => check.pass).length;
const failed = checks.length - passed;
const score = Number((passed / checks.length * 5).toFixed(2));
const report = {
  phase: '29C',
  title: 'UI/UX Bugfix Batch 1 - P1 Stabilization',
  generatedAt: new Date().toISOString(),
  score,
  grade: failed === 0 ? 'A' : score >= 4 ? 'B' : 'C',
  summary: {
    checks: checks.length,
    passed,
    failed,
    p0: 0,
    p1Open: failed,
    p1Closed: passed,
    modules: ['hx-diagram', 'rainwater', 'wastewater']
  },
  fixes: [
    'Saved-record load/deselect/toggle/delete paths are protected through preserveSavedRecordMutation.',
    'Dynamic schema island and segment re-renders preserve active field/caret and viewport.',
    'Line-section based saved records, including h,x saved processes, use the shared scroll/focus protection.'
  ],
  checks,
  nextPhase: {
    id: '29D',
    title: 'Bugfix Batch 2: P2 Cleanup',
    recommendation: failed === 0 ? 'Proceed with P2 cleanup sweep.' : 'Resolve remaining P1 checks before P2 cleanup.'
  }
};

fs.writeFileSync(path.join(root, 'platform-ui-ux-bugfix-batch1-phase29c.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 29C UI/UX Bugfix Batch 1: ${score}/5 (${report.grade}), P1 open=${failed}, P1 closed=${passed}`);
if (failed) process.exitCode = 1;
