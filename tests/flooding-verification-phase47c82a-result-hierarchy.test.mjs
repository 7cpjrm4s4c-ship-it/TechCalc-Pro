import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const resultsSource = readFileSync(new URL('../js/modules/flooding-verification/results.js', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../css/modules-responsive.css', import.meta.url), 'utf8');

test('result hierarchy keeps interpretation, key hydraulics, diagnosis and details in fixed order', () => {
  const orderMatch = resultsSource.match(/const RESULT_GROUP_ORDER = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(orderMatch, 'RESULT_GROUP_ORDER must be declared centrally');

  const order = [...orderMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(order.slice(0, 6), [
    'Planerische Interpretation',
    'Leitungs- und Abflussnachweis',
    'Nachweisstatus',
    'Gleichung (20)',
    'Gleichung (21) – Dauerstufenvergleich',
    'Berechnungsgrundlagen'
  ]);
  assert.match(resultsSource, /groups:\s*orderResultGroups\(groups\)/);
});

test('Nachweisstatus uses the shared fixed 200 px result label column on desktop', () => {
  assert.match(responsiveCss, /result-group--planerische-interpretation[\s\S]*result-group--nachweisstatus[\s\S]*--result-label-width:\s*200px/);
  assert.match(responsiveCss, /grid-template-columns:\s*var\(--result-label-width\)\s+minmax\(0,\s*1fr\)/);
  assert.match(responsiveCss, /result-group--nachweisstatus[\s\S]*text-align:\s*right/);
});
