import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8');
const tokens = read('css/tokens.css');
const layout = read('css/layout.css');
const components = read('css/components.css');
const modules = read('css/modules.css');
const indexHtml = read('index.html');

const cssLinks = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="\.\/(css\/[^"]+)"/g)].map((m) => m[1]);
const expectedCssOrder = ['css/tokens.css', 'css/layout.css', 'css/components.css', 'css/modules.css'];
const moduleDirs = readdirSync('js/modules').filter((name) => statSync(join('js/modules', name)).isDirectory()).sort();
const expectedModules = [
  'buffer-storage',
  'drinking-water',
  'heat-recovery',
  'heating-cooling',
  'hx-diagram',
  'pipe-sizing',
  'pressure-holding',
  'rainwater',
  'unit-converter',
  'ventilation',
  'wastewater',
].sort();

const requiredComponentSelectors = [
  '.card',
  '.tc-card',
  '.field',
  '.control',
  '.segmented',
  '.result-row',
  '.inline-stat',
  '.saved-record-card',
  '.line-section-card',
  '.settings-panel',
  '.module-tab',
  '.overflow-menu',
];

const requiredTokens = [
  '--tc-gap: 10px;',
  '--tc-card-padding: 10px;',
  '--tc-radius-base:',
  '--tc-radius-card:',
  '--tc-control-height:',
  '--ui-gap: var(--tc-gap);',
  '--card-gap: var(--tc-gap);',
  '--field-gap: var(--tc-gap);',
];

const modulesPrimitiveOverrides = [
  /^\s*\.card\b/m,
  /^\s*\.tc-card\b/m,
  /^\s*\.control\b/m,
  /^\s*\.tc-control\b/m,
  /^\s*\.field\b/m,
  /^\s*\.result-row\b/m,
  /^\s*\.inline-stat\b/m,
  /^\s*\.saved-record-card\b/m,
  /^\s*\.line-section-card\b/m,
  /^\s*\.action-button\b/m,
  /^\s*\.mini-button\b/m,
  /^\s*\.segmented\b/m,
].filter((rx) => rx.test(modules));

const componentsLineCount = components.split(/\r?\n/).length;
const modulesLineCount = modules.split(/\r?\n/).length;
const totalCssLines = [tokens, layout, components, modules].reduce((sum, css) => sum + css.split(/\r?\n/).length, 0);
const rebuiltLayerImportantCount = [components, modules].join('\n').match(/!important/g)?.length ?? 0;
const totalImportantCount = [tokens, layout, components, modules].join('\n').match(/!important/g)?.length ?? 0;

const report = {
  phase: '34D',
  status: 'pass',
  cssLinks,
  expectedCssOrder,
  moduleCount: moduleDirs.length,
  modules: moduleDirs,
  componentsLineCount,
  modulesLineCount,
  totalCssLines,
  rebuiltLayerImportantCount,
  totalImportantCount,
  checks: {
    cssOrder: JSON.stringify(cssLinks) === JSON.stringify(expectedCssOrder),
    tokenContract: requiredTokens.every((token) => tokens.includes(token)),
    componentSelectors: requiredComponentSelectors.every((selector) => components.includes(selector)),
    componentsBelowLimit: componentsLineCount < 1000,
    modulesBelowLimit: modulesLineCount < 300,
    rebuiltLayersHaveNoImportant: rebuiltLayerImportantCount === 0,
    modulesAreExceptionLayer: modulesPrimitiveOverrides.length === 0,
    allModulesPresent: JSON.stringify(moduleDirs) === JSON.stringify(expectedModules),
    moduleFileContainsContractHeader: /Module exceptions only/.test(modules),
  },
};

const failures = [];
if (!report.checks.cssOrder) failures.push(`CSS load order must be ${expectedCssOrder.join(' -> ')}`);
if (!report.checks.tokenContract) failures.push('tokens.css does not expose the complete 10px geometry contract');
if (!report.checks.componentSelectors) failures.push('components.css misses one or more required global component selectors');
if (!report.checks.componentsBelowLimit) failures.push(`components.css must stay below 1000 lines after rebuild, got ${componentsLineCount}`);
if (!report.checks.modulesBelowLimit) failures.push(`modules.css must stay below 300 lines as exception layer, got ${modulesLineCount}`);
if (!report.checks.rebuiltLayersHaveNoImportant) failures.push(`components.css/modules.css must not use !important, got ${rebuiltLayerImportantCount}`);
if (!report.checks.modulesAreExceptionLayer) failures.push('modules.css contains top-level global primitive overrides');
if (!report.checks.allModulesPresent) failures.push(`Expected 11 modules, got ${moduleDirs.length}`);
if (!report.checks.moduleFileContainsContractHeader) failures.push('modules.css contract header missing');

if (failures.length) {
  report.status = 'fail';
  report.failures = failures;
}

mkdirSync('docs/audits/css', { recursive: true });
writeFileSync(join('docs/audits/css', 'phase34d-css-regression-smoke.json'), JSON.stringify(report, null, 2) + '\n');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Phase 34D CSS regression smoke passed: ${moduleDirs.length} modules, components=${componentsLineCount}, modules=${modulesLineCount}, totalCss=${totalCssLines}`);
