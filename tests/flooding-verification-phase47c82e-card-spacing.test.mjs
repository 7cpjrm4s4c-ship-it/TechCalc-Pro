import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const polishCss = readFileSync(new URL('../css/components-polish.css', import.meta.url), 'utf8');
const layoutCss = readFileSync(new URL('../css/module-spacing-contract.css', import.meta.url), 'utf8');
const platformView = readFileSync(new URL('../js/platform/moduleRenderer/index.js', import.meta.url), 'utf8');
const hxView = readFileSync(new URL('../js/modules/hx-diagram/view.js', import.meta.url), 'utf8');
const wrgView = readFileSync(new URL('../js/modules/heat-recovery/view.js', import.meta.url), 'utf8');
const mixedAirView = readFileSync(new URL('../js/modules/mixed-air/view.js', import.meta.url), 'utf8');
const floodingView = readFileSync(new URL('../js/modules/flooding-verification/view.js', import.meta.url), 'utf8');
const pressureHoldingView = readFileSync(new URL('../js/modules/pressure-holding/view.js', import.meta.url), 'utf8');
const bufferStorageView = readFileSync(new URL('../js/modules/buffer-storage/view.js', import.meta.url), 'utf8');
const pipeSizingView = readFileSync(new URL('../js/modules/pipe-sizing/view.js', import.meta.url), 'utf8');
const drinkingWaterView = readFileSync(new URL('../js/modules/drinking-water/view.js', import.meta.url), 'utf8');
const wastewaterView = readFileSync(new URL('../js/modules/wastewater/view.js', import.meta.url), 'utf8');
const rainwaterView = readFileSync(new URL('../js/modules/rainwater/view.js', import.meta.url), 'utf8');
const moduleRuntime = readFileSync(new URL('../js/core/moduleRuntime.js', import.meta.url), 'utf8');

const migratedViews = [
  platformView,
  hxView,
  wrgView,
  mixedAirView,
  floodingView,
  pressureHoldingView,
  bufferStorageView,
  pipeSizingView,
  drinkingWaterView,
  wastewaterView,
  rainwaterView
];

test('central card spacing tokens separate title, content and sibling rhythms', () => {
  assert.match(polishCss, /--tc-card-title-gap:\s*calc\(var\(--tc-gap\)\s*\*\s*0\.5\)/);
  assert.match(polishCss, /--tc-card-content-gap:\s*var\(--tc-gap\)/);
  assert.match(polishCss, /--tc-card-stack-gap:\s*var\(--tc-gap\)/);
  assert.match(polishCss, /\.card,\s*\n\.tc-card,\s*\n\.result-card\s*\{[^}]*gap:\s*var\(--tc-card-title-gap\)/s);
  assert.match(polishCss, /\.card__body,\s*\n\.tc-card__body,\s*\n\.result-card__body\s*\{[^}]*gap:\s*var\(--tc-card-content-gap\)/s);
});

test('module layout contract owns the outer vertical rhythm', () => {
  assert.match(layoutCss, /--tc-module-card-gap:\s*var\(--tc-card-stack-gap,\s*var\(--tc-gap\)\)/);
  assert.match(layoutCss, /\.tc-module-root-stack\s*\{[^}]*row-gap:\s*var\(--tc-module-card-gap\)/s);
  assert.match(layoutCss, /\.tc-module-column,[\s\S]*?\.tc-module-section\s*\{[^}]*gap:\s*var\(--tc-module-card-gap\)/s);
  assert.match(layoutCss, /@media\s*\(min-width:\s*1024px\)[\s\S]*?\.tc-module-layout--2\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
});

test('migrated modules declare explicit layouts instead of sibling span columns', () => {
  migratedViews.forEach(view => {
    assert.match(view, /tc-module-layout/);
    assert.match(view, /tc-module-column/);
    assert.doesNotMatch(view, /<div class=["']span-6["']/);
  });
});

test('runtime no longer classifies spacing through observers or adapters', () => {
  assert.doesNotMatch(moduleRuntime, /moduleSpacingAdapter|applyModuleSpacingAdapter|MutationObserver/);
});

test('nested result groups use grid gap instead of ad-hoc margins', () => {
  assert.match(polishCss, /\.result-group\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--tc-card-stack-gap\)/s);
  assert.match(polishCss, /\.result-group\s*>\s*\.card\s*\{[^}]*margin:\s*0/s);
  assert.doesNotMatch(polishCss, /\.result-group\s*>\s*\.card\s*\+\s*\.card\s*\{[^}]*margin-top/s);
});
