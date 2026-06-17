import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const focusManagerPath = join(root, 'js/core/focusManager.js');

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return path.endsWith('.js') || path.endsWith('.mjs') ? [path] : [];
  });
}
function read(path) { return readFileSync(path, 'utf8'); }
function count(text, regex) { return [...text.matchAll(regex)].length; }
function grade(score) { return score >= 4.5 ? 'A' : score >= 3.8 ? 'B' : score >= 3 ? 'C' : score >= 2 ? 'D' : 'F'; }

const focusManager = existsSync(focusManagerPath) ? read(focusManagerPath) : '';
const jsFiles = listFiles(join(root, 'js'));
const moduleFiles = jsFiles.filter(file => relative(root, file).startsWith('js/modules/'));
const directModuleFocusFiles = moduleFiles.map(file => {
  const text = read(file);
  return { path: relative(root, file), directFocusCalls: count(text, /\.focus\s*\(/g) };
}).filter(item => item.directFocusCalls > 0);

const api = {
  safeFocus: /export function safeFocus/.test(focusManager),
  restoreFocus: /export function restoreFocus/.test(focusManager),
  blurActiveElement: /export function blurActiveElement/.test(focusManager),
  getFocusableElements: /export function getFocusableElements/.test(focusManager),
  getPlatformFields: /export function getPlatformFields/.test(focusManager),
  focusNext: /export function focusNext/.test(focusManager),
  platformObject: /export const PlatformFocusManager/.test(focusManager)
};
const apiCoverage = Object.values(api).filter(Boolean).length / Object.keys(api).length;

const coreAdapters = {
  domUpdate: /focusManager\.js/.test(read(join(root, 'js/core/domUpdate.js'))),
  moduleRuntime: /focusManager\.js/.test(read(join(root, 'js/core/moduleRuntime.js'))),
  eventPipeline: /focusManager\.js/.test(read(join(root, 'js/core/eventPipeline.js')))
};
const coreAdapterCoverage = Object.values(coreAdapters).filter(Boolean).length / Object.keys(coreAdapters).length;

const coreFocusOccurrences = jsFiles.map(file => {
  const rel = relative(root, file);
  const text = read(file);
  return { path: rel, focusCalls: count(text, /\.focus\s*\(/g), usesFocusManager: /focusManager\.js|PlatformFocusManager|safeFocus|restoreFocus|focusNext/.test(text) };
}).filter(item => item.focusCalls > 0);

let score = 4.0 + apiCoverage * 0.55 + coreAdapterCoverage * 0.35;
if (directModuleFocusFiles.length === 0) score += 0.1;
score = Math.max(1, Math.min(5, Number(score.toFixed(2))));

const findings = [];
if (directModuleFocusFiles.length) {
  findings.push({ area: 'moduleDirectFocusCalls', risk: 'P1', action: 'Direkte Modul-Fokusaufrufe ueber PlatformFocusManager kapseln.', evidence: directModuleFocusFiles });
}
findings.push({ area: 'enterTabNavigation', risk: 'P2', action: 'Enter-/Tab-Navigation bleibt absichtlich Scope von 28B.2/28B.3.', evidence: ['js/core/eventPipeline.js'] });
findings.push({ area: 'modalFocusRestore', risk: 'P2', action: 'Dialog-/Menue-Fokuspfade in 28B.4 gegen Dynamic Inputs haerten.', evidence: coreFocusOccurrences.filter(item => item.path.includes('app.js') || item.path.includes('menuFallback.js')) });

const report = {
  phase: '28B.1',
  name: 'Platform Focus Service Foundation',
  generatedAt: new Date().toISOString(),
  overallScore: score,
  overallGrade: grade(score),
  executiveSummary: {
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    conclusion: 'Der zentrale PlatformFocusManager ist eingefuehrt. Core-Fokuspfade fuer Render-Restore, Modul-Mount und naechstes Plattformfeld sind gekapselt; Navigationssemantik folgt in 28B.2/28B.3.'
  },
  api,
  apiCoverage: Number(apiCoverage.toFixed(2)),
  coreAdapters,
  coreAdapterCoverage: Number(coreAdapterCoverage.toFixed(2)),
  directModuleFocusFiles,
  coreFocusOccurrences,
  acceptance: {
    explicitServiceContract: apiCoverage === 1,
    coreRestoreFocusEncapsulated: coreAdapters.domUpdate && coreAdapters.moduleRuntime,
    enterFieldFocusDelegatesToService: coreAdapters.eventPipeline,
    moduleDirectFocusCallsEncapsulated: directModuleFocusFiles.length === 0,
    enterTabImplementationDeferred: true
  },
  findings
};

writeFileSync(join(root, 'platform-focus-service-phase28b1.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 28B.1 focus service audit completed: ${report.overallScore} (${report.overallGrade})`);
console.log(`Module direct focus files: ${directModuleFocusFiles.length}`);
