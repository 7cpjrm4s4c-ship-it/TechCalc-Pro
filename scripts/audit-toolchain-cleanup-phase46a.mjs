import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const scriptsDir = new URL('../scripts/', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const scriptFiles = readdirSync(scriptsDir)
  .filter((name) => name.endsWith('.mjs'))
  .sort();

const referenced = new Set();

function collectFromText(text) {
  for (const match of text.matchAll(/scripts\/([A-Za-z0-9_.-]+\.mjs)/g)) {
    referenced.add(match[1]);
  }
}

for (const command of Object.values(pkg.scripts || {})) {
  collectFromText(command);
}

collectFromText(readFileSync(new URL('../scripts/test-integration.mjs', import.meta.url), 'utf8'));

referenced.add('audit-toolchain-cleanup-phase46a.mjs');

const unused = scriptFiles.filter((name) => !referenced.has(name));
const missing = [...referenced].filter((name) => !scriptFiles.includes(name));

if (missing.length > 0) {
  console.error('Toolchain references missing script files:');
  for (const name of missing.sort()) console.error(`- ${name}`);
  process.exit(1);
}

if (unused.length > 0) {
  console.error('Unused scripts found. Either wire them into package.json/test-integration or remove them:');
  for (const name of unused.sort()) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`Phase 46A toolchain cleanup ok: ${scriptFiles.length} scripts, ${referenced.size} referenced, 0 unused`);
