import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components-polish.css', import.meta.url), 'utf8');

test('central typography contract defines explicit result roles', () => {
  assert.match(css, /--tc-font-weight-label:\s*700/);
  assert.match(css, /--tc-font-weight-value:\s*800/);
  assert.match(css, /--tc-font-weight-heading:\s*900/);
  assert.match(css, /--tc-result-label-size:/);
  assert.match(css, /--tc-result-value-size:/);
  assert.match(css, /--tc-result-copy-line-height:\s*1\.5/);
});

test('result labels, values and narrative rows use the central typography roles', () => {
  assert.match(css, /\.result-row\s*>\s*span\s*\{[^}]*font-size:\s*var\(--tc-result-label-size\)/s);
  assert.match(css, /\.result-row\s*>\s*strong\s*\{[^}]*font-size:\s*var\(--tc-result-value-size\)/s);
  assert.match(css, /\.result-group--planerische-interpretation[\s\S]*font-weight:\s*var\(--tc-font-weight-label\)/);
  assert.match(css, /\.main-result\s*>\s*strong\s*\{[^}]*font-weight:\s*var\(--tc-font-weight-heading\)/s);
});

test('German copy hyphenates normally while headings and units remain intact', () => {
  assert.match(css, /-webkit-hyphens:\s*auto;\s*\n\s*hyphens:\s*auto/);
  assert.match(css, /\.card__title,[\s\S]*hyphens:\s*none/);
  assert.match(css, /\.unit\s*\{[\s\S]*hyphens:\s*none/);
  assert.doesNotMatch(css, /word-break:\s*break-all/);
});
