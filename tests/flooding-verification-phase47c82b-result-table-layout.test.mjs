import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components-polish.css', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/platform/resultRenderer/index.js', import.meta.url), 'utf8');

test('central result renderer uses one result-list and result-row contract', () => {
  assert.match(renderer, /class="result-list"/);
  assert.match(renderer, /const classes = \['result-row'\]/);
});

test('result rows use shared geometry, spacing and divider tokens', () => {
  assert.match(css, /--tc-result-row-min-height:\s*48px/);
  assert.match(css, /--tc-result-row-padding-block:/);
  assert.match(css, /--tc-result-label-column:\s*minmax\(180px,\s*42%\)/);
  assert.match(css, /\.result-row\s*\{[\s\S]*grid-template-columns:\s*var\(--tc-result-label-column\)\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /min-height:\s*var\(--tc-result-row-min-height\)/);
  assert.match(css, /padding-block:\s*var\(--tc-result-row-padding-block\)/);
  assert.match(css, /border-bottom:\s*1px solid var\(--tc-result-row-divider\)/);
});

test('result values are consistently right aligned and use tabular figures', () => {
  assert.match(css, /\.result-row\s*>\s*strong\s*\{[\s\S]*justify-self:\s*end/);
  assert.match(css, /\.result-row\s*>\s*strong\s*\{[\s\S]*text-align:\s*right/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
});

test('mobile result tables collapse without overlapping labels and values', () => {
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*\.result-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*\.result-row\s*>\s*strong\s*\{[\s\S]*text-align:\s*left/);
});
