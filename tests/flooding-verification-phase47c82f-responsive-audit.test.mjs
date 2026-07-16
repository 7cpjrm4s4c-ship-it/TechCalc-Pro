import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/modules-responsive.css', import.meta.url), 'utf8');

test('flooding result summary uses five, two and one column layouts by viewport', () => {
  assert.match(css, /@media\s*\(min-width:\s*1024px\)[\s\S]*?inline-stats\s*\{[\s\S]*?repeat\(5,/);
  assert.match(css, /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)[\s\S]*?inline-stats\s*\{[\s\S]*?repeat\(2,/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*?inline-stats\s*\{[\s\S]*?minmax\(0,\s*1fr\)/);
});

test('wide explanation tile spans the tablet grid and resets on phones', () => {
  assert.match(css, /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)[\s\S]*?inline-stat--span-3[\s\S]*?grid-column:\s*1\s*\/\s*-1/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*?inline-stat--span-3[\s\S]*?grid-column:\s*auto/);
});

test('fixed result columns collapse and long values remain shrinkable on phones', () => {
  assert.match(css, /result-group--planerische-interpretation[\s\S]*?result-group--nachweisstatus[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /result-row\s*>\s*strong[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0[\s\S]*?text-align:\s*left/);
});

test('tablet and mobile containers explicitly prevent horizontal overflow', () => {
  assert.match(css, /@media\s*\(max-width:\s*1023px\)[\s\S]*?\.result-group,[\s\S]*?\.card__body[\s\S]*?min-width:\s*0[\s\S]*?max-width:\s*100%/);
});
