import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = pkg.scripts || {};
const scriptNames = Object.keys(scripts);
const phaseScripts = scriptNames.filter((name) => /^test:phase\d+/i.test(name));

if (phaseScripts.length > 0) {
  console.error('Phase-specific npm test scripts are not allowed in package.json:');
  for (const name of phaseScripts) {
    console.error(`- ${name}`);
  }
  console.error('Keep phase audit files in scripts/, but wire them through scripts/test-integration.mjs or run them directly with node when needed.');
  process.exit(1);
}

const requiredScripts = ['test', 'test:integration', 'test:e2e', 'build', 'build:minified'];
const missing = requiredScripts.filter((name) => !scripts[name]);
if (missing.length > 0) {
  console.error(`Missing required top-level scripts: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Phase 39A package script hygiene ok');
