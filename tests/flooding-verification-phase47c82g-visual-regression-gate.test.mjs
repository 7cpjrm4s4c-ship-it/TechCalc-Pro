import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('visual regression gate covers desktop, tablet and mobile projects', () => {
  const config = read('playwright.config.mjs');
  assert.match(config, /chromium-desktop/);
  assert.match(config, /webkit-tablet/);
  assert.match(config, /iPad Pro 11/);
  assert.match(config, /webkit-mobile/);
  assert.match(config, /iPhone 13/);
  assert.match(config, /screenshot:\s*'only-on-failure'/);
});

test('visual contract checks every supported theme and real DOM geometry', () => {
  const spec = read('tests/e2e/flooding-verification-visual-regression.spec.mjs');
  assert.match(spec, /\['dark', 'light', 'system'\]/);
  assert.match(spec, /horizontal overflow/);
  assert.match(spec, /vertically clipped content/);
  assert.match(spec, /label\/value overlap/);
  assert.match(spec, /child outside horizontal card bounds/);
  assert.doesNotMatch(spec, /toHaveScreenshot/);
});

test('visual gate has an explicit package script', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(
    pkg.scripts['test:visual:flooding'],
    'playwright test tests/e2e/flooding-verification-visual-regression.spec.mjs'
  );
});
