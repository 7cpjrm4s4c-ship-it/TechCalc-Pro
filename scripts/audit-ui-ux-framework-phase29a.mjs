import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const moduleRoot = path.join(root, 'js/modules');
const modules = fs.readdirSync(moduleRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const axes = [
  { id: 'input-confirmation', label: 'Eingabe und automatische Bestaetigung', severityIfBroken: 'P1' },
  { id: 'enter-tab-navigation', label: 'Enter/Tab/Shift+Tab Navigation', severityIfBroken: 'P1' },
  { id: 'focus-restore', label: 'Fokus- und Caret-Restore nach Re-Render', severityIfBroken: 'P1' },
  { id: 'scroll-stability', label: 'Scroll-Stabilitaet bei Auswahl, Abwahl und Live-Render', severityIfBroken: 'P1' },
  { id: 'saved-records', label: 'Saved Records: save/load/update/delete/expand/collapse', severityIfBroken: 'P1' },
  { id: 'live-rendering', label: 'Live-Rendering ohne Aktualisieren-Zwang', severityIfBroken: 'P1' },
  { id: 'unit-switching', label: 'Einheitenwechsel und deutsche Zahlformate', severityIfBroken: 'P2' },
  { id: 'result-rendering', label: 'Ergebnisanzeige, Plausibilitaet und leere Zustaende', severityIfBroken: 'P1' },
  { id: 'responsive-layout', label: 'Desktop/Mobile Layout und Touch-Ziele', severityIfBroken: 'P2' },
  { id: 'error-reset-states', label: 'Fehlermeldungen, Reset und Default-State', severityIfBroken: 'P2' }
];

const referenceModules = new Set(['heat-recovery', 'buffer-storage', 'hx-diagram']);
const highRiskModules = new Set(['rainwater', 'wastewater', 'hx-diagram', 'drinking-water']);

function moduleSignals(moduleName) {
  const dir = `js/modules/${moduleName}`;
  const files = fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => `${dir}/${entry.name}`);
  const source = files.map(file => read(file)).join('\n');
  return {
    files,
    hasController: exists(`${dir}/controller.js`),
    hasViewModel: exists(`${dir}/viewModel.js`),
    hasView: exists(`${dir}/view.js`),
    hasResults: exists(`${dir}/results.js`),
    hasDynamicRenderer: exists(`${dir}/dynamicRenderer.js`),
    hasRenderPipeline: exists(`${dir}/renderPipeline.js`),
    hasDiagramRenderer: exists(`${dir}/diagramRenderer.js`),
    hasSavedRecords: /saved|record|processes|records/i.test(source),
    usesFocusManager: /PlatformFocusManager|focusManager|safeFocus|preserveFocusDuring/.test(source),
    usesScrollManager: /PlatformScrollManager|scrollManager|preserveSavedRecordMutation|runWithoutScrollJump/.test(source),
    hasLiveHandlers: /input|change|keyup|keydown|render|update/i.test(source),
    directFocusCalls: (source.match(/\.focus\(/g) || []).length,
    directScrollCalls: (source.match(/scrollIntoView\(|window\.scrollTo\(/g) || []).length,
    lineCount: source.split(/\r?\n/).length
  };
}

const matrix = modules.map(moduleName => {
  const signals = moduleSignals(moduleName);
  const risk = highRiskModules.has(moduleName) ? 'high' : referenceModules.has(moduleName) ? 'reference' : 'normal';
  const checks = axes.map(axis => ({
    axis: axis.id,
    label: axis.label,
    severityIfBroken: axis.severityIfBroken,
    requiredEvidence: [
      'Desktop manual pass',
      'Mobile/responsive manual pass',
      'Saved-record pass where supported',
      'Regression note with exact reproduction path'
    ],
    status: 'planned'
  }));
  return { module: moduleName, risk, signals, checks };
});

const p0 = [];
const p1 = [];
const p2 = [];
if (modules.length < 10) p0.push('Weniger Module gefunden als erwartet. UI/UX Audit-Matrix unvollstaendig.');
if (!exists('js/core/focusManager.js')) p1.push('FocusManager fehlt als Voraussetzung fuer Phase 29.');
if (!exists('js/core/scrollManager.js')) p1.push('ScrollManager fehlt als Voraussetzung fuer Phase 29.');
if (!exists('platform-verification-phase28d.json')) p1.push('Phase 28D Verification Report fehlt.');

for (const entry of matrix) {
  if (entry.signals.directScrollCalls > 0 && !entry.signals.usesScrollManager) {
    p2.push(`${entry.module}: direkte Scroll-Signale ohne ScrollManager-Nachweis.`);
  }
  if (entry.signals.directFocusCalls > 0 && !entry.signals.usesFocusManager) {
    p2.push(`${entry.module}: direkte Fokus-Signale ohne FocusManager-Nachweis.`);
  }
}

const totalChecks = matrix.length * axes.length;
const prerequisites = [
  exists('js/core/focusManager.js'),
  exists('js/core/scrollManager.js'),
  exists('js/core/eventManager.js'),
  exists('platform-verification-phase28d.json'),
  modules.length >= 11,
  totalChecks >= 100
];
let score = prerequisites.filter(Boolean).length / prerequisites.length * 5;
if (p0.length) score = Math.min(score, 3.0);
else if (p1.length) score = Math.min(score, 4.0);
score = Number(score.toFixed(2));

const report = {
  phase: '29A',
  title: 'Module-wide UI/UX Bugfix Audit Framework',
  generatedAt: new Date().toISOString(),
  score,
  grade: score >= 4.5 ? 'A' : score >= 4.0 ? 'B' : score >= 3.0 ? 'C' : 'D',
  summary: {
    modules: modules.length,
    axes: axes.length,
    totalPlannedChecks: totalChecks,
    referenceModules: [...referenceModules].sort(),
    highRiskModules: [...highRiskModules].sort(),
    p0: p0.length,
    p1: p1.length,
    p2: p2.length
  },
  severityRules: {
    P0: 'Blockiert produktive Nutzung, Datenverlust, nicht ladbares Modul oder vollstaendig falscher Ergebniszustand.',
    P1: 'Kern-UX oder Rechenfluss gestoert: Eingabe, Saved Records, Fokus/Scroll, Live-Rendering oder Ergebnisanzeige.',
    P2: 'Nicht blockierende Inkonsistenz: Layout, Labels, Edge Cases, mobile Detailfehler, kosmetische Validierung.',
    P3: 'Kosmetik, Text, optionale Verbesserung ohne Workflow-Auswirkung.'
  },
  axes,
  moduleMatrix: matrix,
  findings: { p0, p1, p2 },
  nextPhase: {
    id: '29B',
    title: 'Modulpruefung einzeln',
    recommendation: 'Mit den historisch risikoreichsten Modulen starten: Regenwasser, Entwaesserung, h,x, Trinkwasser.'
  }
};

fs.writeFileSync(path.join(root, 'platform-ui-ux-audit-framework-phase29a.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 29A UI/UX Audit Framework: ${score}/5 (${report.grade}), ${modules.length} Module, ${totalChecks} Checks.`);
if (p0.length || p1.length || p2.length) {
  console.log(`Findings: P0=${p0.length}, P1=${p1.length}, P2=${p2.length}`);
}
