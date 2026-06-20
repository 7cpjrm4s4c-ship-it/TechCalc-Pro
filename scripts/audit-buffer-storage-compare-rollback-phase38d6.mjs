#!/usr/bin/env node
import fs from 'node:fs';

const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const results = fs.readFileSync('js/modules/buffer-storage/results.js', 'utf8');
const components = fs.readFileSync('css/components.css', 'utf8');
const modules = fs.readFileSync('css/modules.css', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');

const mustContain = [
  [view, 'ph-help ph-help--inline buffer-help', 'buffer runtime help keeps legacy spacing alias'],
  [view, 'data-buffer-dynamic="input-blocks"', 'buffer input dynamic target exists'],
  [view, "if (vm.isCompareMode) return [renderRuntimeInputs(vm), renderDefrostInputs(vm), renderReserveInputs(vm)].join('');", 'compare renderer returns canonical 38C card sequence'],
  [results, 'formula tc-formula ph-formula', 'buffer formulas keep pressure-holding formula alias'],
  [components, '.tc-help,\n.ph-help { margin-top: var(--tc-gap); }', 'legacy help alias spacing restored'],
  [components, '.tc-stack,\n.tc-stack--section,', 'stack layout contract exists'],
  [modules, ".module-view[data-module='buffer-storage'] .ph-help", 'buffer help module alias restored'],
  [sw, "CACHE_REVISION = 'phase38d6-buffer-compare-rollback'", 'cache revision bumped for stale mobile clients']
];

const failures = mustContain.filter(([text, needle]) => !text.includes(needle));
if (failures.length) {
  console.error('Phase 38D.6 rollback audit failed:');
  for (const [, , label] of failures) console.error(`- ${label}`);
  process.exit(1);
}

const mustNotContain = [
  [view, 'buffer-compare-sections', 'failed compare wrapper workaround removed'],
  [view, 'buffer-input-blocks', 'failed input wrapper workaround removed'],
  [components, '.tc-help--inline--inline', 'broken duplicated tc-help inline selector removed'],
  [components, '.tc-formula--small--small', 'broken duplicated formula selector removed'],
  [components, '.tc-pill span', 'broken tc-pill child selector removed']
];

const bad = mustNotContain.filter(([text, needle]) => text.includes(needle));
if (bad.length) {
  console.error('Phase 38D.6 rollback audit found stale failed-fix artefacts:');
  for (const [, , label] of bad) console.error(`- ${label}`);
  process.exit(1);
}

console.log('Phase 38D.6 rollback audit passed.');
