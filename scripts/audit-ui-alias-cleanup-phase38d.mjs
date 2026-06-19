import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, predicate, out);
    else if (predicate(path)) out.push(path);
  }
  return out;
}

const files = [
  ...walk('css', (path) => path.endsWith('.css')),
  ...walk('js', (path) => path.endsWith('.js')),
  'index.html'
];
const disallowedClassPattern = /class\s*=\s*(["'`])(?:(?!\1)[\s\S])*?\b(?:dw|ph)-[a-zA-Z0-9_-]+(?:(?!\1)[\s\S])*?\1/g;
const disallowedCssPattern = /\.(?:dw|ph)-[a-zA-Z0-9_-]+/g;
const failures = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const classMatches = [...source.matchAll(disallowedClassPattern)].map((m) => m[0]);
  const cssMatches = file.endsWith('.css') ? [...source.matchAll(disallowedCssPattern)].map((m) => m[0]) : [];
  if (classMatches.length || cssMatches.length) failures.push({ file, matches: [...new Set([...classMatches, ...cssMatches])] });
}

if (failures.length) {
  console.error('Phase 38D failed: visual legacy module aliases remain.');
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.matches.slice(0, 8).join(', ')}`);
  process.exit(1);
}

console.log('Phase 38D UI alias cleanup guard ok');
