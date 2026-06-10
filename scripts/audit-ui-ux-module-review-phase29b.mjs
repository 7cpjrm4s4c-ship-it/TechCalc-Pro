import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = file => fs.existsSync(path.join(root, file));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const framework = JSON.parse(read('platform-ui-ux-audit-framework-phase29a.json'));
const axes = framework.axes;
const moduleRoot = path.join(root, 'js/modules');
const modules = fs.readdirSync(moduleRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const referenceModules = new Set(['buffer-storage', 'heat-recovery', 'hx-diagram']);
const highRiskModules = new Set(['rainwater', 'wastewater', 'hx-diagram', 'drinking-water']);
const legacySurfaceModules = new Set(['rainwater', 'wastewater']);

function moduleFiles(moduleName) {
  const dir = `js/modules/${moduleName}`;
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => `${dir}/${entry.name}`)
    .sort();
}

function signals(moduleName) {
  const files = moduleFiles(moduleName);
  const source = files.map(file => read(file)).join('\n');
  return {
    files,
    fileNames: files.map(file => path.basename(file)),
    hasController: exists(`js/modules/${moduleName}/controller.js`),
    hasView: exists(`js/modules/${moduleName}/view.js`),
    hasViewModel: exists(`js/modules/${moduleName}/viewModel.js`),
    hasResults: exists(`js/modules/${moduleName}/results.js`),
    hasDynamicRenderer: exists(`js/modules/${moduleName}/dynamicRenderer.js`),
    hasRenderPipeline: exists(`js/modules/${moduleName}/renderPipeline.js`),
    hasDiagramRenderer: exists(`js/modules/${moduleName}/diagramRenderer.js`),
    hasTables: exists(`js/modules/${moduleName}/tables.js`),
    usesPlatformModule: /createPlatformModule\s*\(/.test(source),
    usesFocusManager: /PlatformFocusManager|focusManager|preserveFocusDuring|navigateByOffset|handleEnterNavigation|handleTabNavigation/.test(source),
    usesScrollManager: /PlatformScrollManager|scrollManager|preserveScroll|runWithoutScrollJump|preserveSavedRecordMutation|preserveModuleSwitchScroll/.test(source),
    usesNumberService: /parseLocaleNumber|formatLocaleNumber|numberService|normalizeNumber|formatNumber|decimalComma|de-DE/.test(source),
    hasSavedRecords: /savedRecords|saved-record|createSavedRecord|records|savedItems|savedProcesses/i.test(source),
    hasLiveRendering: /onInput|input|change|renderDynamic|update[A-Z]|live|dynamic/i.test(source),
    hasResetHandling: /reset|clear|defaultState|createInitialState|initialState/i.test(source),
    hasErrorHandling: /error|invalid|warning|validation|isFinite|Number\.isFinite/i.test(source),
    directScrollCalls: (source.match(/scrollIntoView\(|window\.scrollTo\(|\.scrollTop\s*=/g) || []).length,
    directFocusCalls: (source.match(/\.focus\(/g) || []).length,
    directStorageCalls: (source.match(/localStorage\.|sessionStorage\./g) || []).length,
    lineCount: source.split(/\r?\n/).length
  };
}

function statusFor(axisId, sig, moduleName) {
  const isLegacySurface = legacySurfaceModules.has(moduleName);
  switch (axisId) {
    case 'input-confirmation':
      return sig.usesPlatformModule && sig.hasController ? 'pass' : 'review';
    case 'enter-tab-navigation':
      return sig.usesFocusManager ? 'pass' : 'review';
    case 'focus-restore':
      return sig.usesFocusManager ? 'pass' : 'review';
    case 'scroll-stability':
      if (sig.usesScrollManager) return 'pass';
      return sig.directScrollCalls > 0 ? 'fail' : 'review';
    case 'saved-records':
      if (!sig.hasSavedRecords) return 'not-applicable';
      return sig.hasController && sig.hasResults ? (isLegacySurface ? 'review' : 'pass') : 'review';
    case 'live-rendering':
      return sig.hasDynamicRenderer || sig.hasRenderPipeline || sig.hasLiveRendering ? (isLegacySurface ? 'review' : 'pass') : 'review';
    case 'unit-switching':
      return moduleName === 'unit-converter' || sig.usesNumberService ? 'pass' : 'review';
    case 'result-rendering':
      return sig.hasResults ? 'pass' : 'review';
    case 'responsive-layout':
      return sig.hasView || sig.hasResults || sig.hasTables ? 'pass' : 'review';
    case 'error-reset-states':
      return sig.hasResetHandling && sig.hasErrorHandling ? 'pass' : 'review';
    default:
      return 'review';
  }
}

function severityForStatus(axis, status, moduleName) {
  if (status === 'fail') return axis.severityIfBroken;
  if (status === 'review') {
    if (highRiskModules.has(moduleName) && ['scroll-stability', 'saved-records', 'live-rendering', 'focus-restore'].includes(axis.id)) return axis.severityIfBroken;
    return axis.severityIfBroken === 'P1' ? 'P2' : 'P3';
  }
  return null;
}

const findings = { p0: [], p1: [], p2: [], p3: [] };
const moduleReviews = modules.map(moduleName => {
  const sig = signals(moduleName);
  const checks = axes.map(axis => {
    const status = statusFor(axis.id, sig, moduleName);
    const severity = severityForStatus(axis, status, moduleName);
    const evidence = [];
    if (axis.id === 'enter-tab-navigation' || axis.id === 'focus-restore') evidence.push(sig.usesFocusManager ? 'FocusManager signal present' : 'No module-level FocusManager signal');
    if (axis.id === 'scroll-stability') evidence.push(sig.usesScrollManager ? 'ScrollManager signal present' : `Direct scroll calls: ${sig.directScrollCalls}`);
    if (axis.id === 'saved-records') evidence.push(sig.hasSavedRecords ? 'Saved-record surface detected' : 'No saved-record surface detected');
    if (axis.id === 'live-rendering') evidence.push(sig.hasDynamicRenderer || sig.hasRenderPipeline ? 'Dedicated dynamic/render pipeline present' : 'Live handlers inferred from controller/source');
    if (axis.id === 'unit-switching') evidence.push(sig.usesNumberService ? 'Number/locale service signal present' : 'Manual locale check required');
    if (axis.id === 'result-rendering') evidence.push(sig.hasResults ? 'results.js present' : 'No dedicated results.js');

    const check = { axis: axis.id, label: axis.label, status, severity, evidence };
    if (status === 'fail' || status === 'review') {
      const text = `${moduleName}: ${axis.id} -> ${status}${severity ? ` (${severity})` : ''}`;
      if (severity === 'P0') findings.p0.push(text);
      else if (severity === 'P1') findings.p1.push(text);
      else if (severity === 'P2') findings.p2.push(text);
      else findings.p3.push(text);
    }
    return check;
  });
  const pass = checks.filter(c => c.status === 'pass').length;
  const review = checks.filter(c => c.status === 'review').length;
  const fail = checks.filter(c => c.status === 'fail').length;
  const na = checks.filter(c => c.status === 'not-applicable').length;
  const moduleScore = Number(((pass + na * 0.8 + review * 0.55) / checks.length * 5).toFixed(2));
  return {
    module: moduleName,
    risk: referenceModules.has(moduleName) ? 'reference' : highRiskModules.has(moduleName) ? 'high' : 'normal',
    score: moduleScore,
    grade: moduleScore >= 4.5 ? 'A' : moduleScore >= 4.0 ? 'B' : moduleScore >= 3.0 ? 'C' : 'D',
    summary: { pass, review, fail, notApplicable: na },
    signals: sig,
    checks
  };
});

const passCount = moduleReviews.reduce((sum, item) => sum + item.summary.pass, 0);
const reviewCount = moduleReviews.reduce((sum, item) => sum + item.summary.review, 0);
const failCount = moduleReviews.reduce((sum, item) => sum + item.summary.fail, 0);
const naCount = moduleReviews.reduce((sum, item) => sum + item.summary.notApplicable, 0);
const totalChecks = passCount + reviewCount + failCount + naCount;
let score = (passCount + naCount * 0.8 + reviewCount * 0.55) / totalChecks * 5;
if (findings.p0.length) score = Math.min(score, 3.0);
score = Number(score.toFixed(2));

const remediationBacklog = [
  {
    id: '29C-P1-001',
    priority: 'P1',
    title: 'High-risk module manual UX verification',
    modules: moduleReviews.filter(m => m.risk === 'high').map(m => m.module),
    scope: 'Saved Records, live rendering, focus restore and scroll stability must be manually replayed before bugfix batching.'
  },
  {
    id: '29C-P1-002',
    priority: 'P1',
    title: 'Legacy surface review for Regenwasser and Entwaesserung',
    modules: ['rainwater', 'wastewater'],
    scope: 'Review table/result surfaces and saved-record flows because these modules still expose legacy rendering surfaces.'
  },
  {
    id: '29D-P2-001',
    priority: 'P2',
    title: 'Locale/unit switching manual sweep',
    modules,
    scope: 'German comma formatting, thousand separators and unit label changes across all modules.'
  }
];

const report = {
  phase: '29B',
  title: 'Module-wide UI/UX Module Review',
  generatedAt: new Date().toISOString(),
  score,
  grade: score >= 4.5 ? 'A' : score >= 4.0 ? 'B' : score >= 3.0 ? 'C' : 'D',
  summary: {
    modules: modules.length,
    axes: axes.length,
    totalChecks,
    pass: passCount,
    review: reviewCount,
    fail: failCount,
    notApplicable: naCount,
    p0: findings.p0.length,
    p1: findings.p1.length,
    p2: findings.p2.length,
    p3: findings.p3.length,
    highRiskModules: [...highRiskModules].sort(),
    referenceModules: [...referenceModules].sort()
  },
  severityRules: framework.severityRules,
  moduleReviews,
  findings,
  remediationBacklog,
  nextPhase: {
    id: '29C',
    title: 'Bugfix Batch 1: P0/P1',
    recommendation: findings.p1.length
      ? 'Start with P1 manual verification and targeted fixes for high-risk modules.'
      : 'No P1 found by static audit; execute manual high-risk pass before P2 cleanup.'
  }
};

fs.writeFileSync(path.join(root, 'platform-ui-ux-module-review-phase29b.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 29B UI/UX Module Review: ${score}/5 (${report.grade}), checks=${totalChecks}, P0=${findings.p0.length}, P1=${findings.p1.length}, P2=${findings.p2.length}`);
