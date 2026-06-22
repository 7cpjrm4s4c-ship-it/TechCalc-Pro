import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const files = ['.npmrc', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'netlify.toml'];
const forbidden = [
  /packages\.applied-caas-gateway\d*\.internal\.api\.openai\.org/i,
  /artifactory/i,
  /verdaccio/i,
  /npm\.pkg\.github\.com/i,
  /packages\.registry/i,
];

const findings = [];
for (const file of files) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of forbidden) {
      if (pattern.test(line) && !line.includes('registry=https://registry.npmjs.org/')) {
        findings.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    }
  });
}

if (findings.length) {
  console.error('Private/internal npm registry references found:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

const npmrcPath = join(root, '.npmrc');
if (!existsSync(npmrcPath)) {
  console.error('.npmrc is missing; expected explicit public npm registry for Netlify.');
  process.exit(1);
}
const npmrc = readFileSync(npmrcPath, 'utf8').trim();
if (npmrc !== 'registry=https://registry.npmjs.org/') {
  console.error(`Unexpected .npmrc content: ${npmrc}`);
  process.exit(1);
}

console.log('Phase 38H registry audit passed.');
