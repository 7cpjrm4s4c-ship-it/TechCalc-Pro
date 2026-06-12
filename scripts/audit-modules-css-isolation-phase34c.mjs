import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const components = readFileSync('css/components.css', 'utf8');
const modules = readFileSync('css/modules.css', 'utf8');

const forbiddenImportant = /!important/.test(modules);
const forbiddenGlobalPrimitiveSelectors = [
  /^\s*\.card\b/m,
  /^\s*\.control\b/m,
  /^\s*\.field\b/m,
  /^\s*\.action-button\b/m,
  /^\s*\.mini-button\b/m,
  /^\s*\.segmented\b/m,
  /^\s*\.result-row\b/m,
  /^\s*\.inline-stat\b/m,
  /^\s*\.saved-record-card\b/m,
  /^\s*\.line-section-card\b/m,
  /^\s*\.tc-card\b/m,
  /^\s*\.tc-control\b/m,
].filter((rx) => rx.test(modules));

const forbiddenComponentFileModuleBlocks = /data-module=|module-view\[data-module|\.hx-|\.wrg-|\.pipe-|\.wastewater-|\.rainwater-|\.buffer-/m.test(components);
const componentsLines = components.split(/\r?\n/).length;
const modulesLines = modules.split(/\r?\n/).length;

const report = {
  phase: '34C',
  componentsLines,
  modulesLines,
  modulesImportantCount: (modules.match(/!important/g) || []).length,
  forbiddenGlobalPrimitiveSelectorCount: forbiddenGlobalPrimitiveSelectors.length,
  componentFileContainsModuleRules: forbiddenComponentFileModuleBlocks,
  status: 'pass',
};

const failures = [];
if (componentsLines >= 2000) failures.push(`components.css must stay below 2000 lines, got ${componentsLines}`);
if (modulesLines >= 500) failures.push(`modules.css must stay below 500 lines, got ${modulesLines}`);
if (forbiddenImportant) failures.push('modules.css must not use !important');
if (forbiddenGlobalPrimitiveSelectors.length) failures.push('modules.css contains top-level global primitive selectors');
if (forbiddenComponentFileModuleBlocks) failures.push('components.css contains module-specific selectors');

if (failures.length) {
  report.status = 'fail';
  report.failures = failures;
}

mkdirSync('docs/audits/css', { recursive: true });
writeFileSync(join('docs/audits/css', 'phase34c-modules-css-isolation.json'), JSON.stringify(report, null, 2) + '\n');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Phase 34C CSS isolation audit passed: components=${componentsLines} lines, modules=${modulesLines} lines`);
