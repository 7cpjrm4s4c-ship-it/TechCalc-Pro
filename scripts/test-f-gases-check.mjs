import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const tests = [
  'tests/f-gases-certification-and-pdf-regression.test.mjs',
  'tests/f-gases-check-skeleton.test.mjs',
  'tests/f-gases-date-service-availability-regression.test.mjs',
  'tests/f-gases-hermetic-exception-regression.test.mjs',
  'tests/f-gases-pdf-language-layout-regression.test.mjs',
  'tests/f-gases-pdf-saved-records.test.mjs',
  'tests/f-gases-refrigerant-label-and-r404a-regression.test.mjs',
  'tests/f-gases-result-labels-regression.test.mjs',
  'tests/f-gases-rule-engine.test.mjs',
  'tests/f-gases-temporal-basis-regression.test.mjs',
  'tests/f-gases-ui-completeness-regression.test.mjs',
  'tests/f-gases-ui-report.test.mjs'
];
for (const test of tests) {
  console.log(`> node ${test}`);
  execFileSync('node', [test], { stdio: 'inherit' });
}
console.log(`TechCalc Pro ${version} F-Gases gate ok (${tests.length} tests)`);
