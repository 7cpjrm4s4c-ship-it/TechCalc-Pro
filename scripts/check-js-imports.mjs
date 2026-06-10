import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const skip = new Set(['node_modules']);
function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    if (skip.has(name)) return [];
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return path.endsWith('.js') || path.endsWith('.mjs') ? [path] : [];
  });
}

const files = walk(root).filter(file => !file.includes('/node_modules/'));
for (const file of files) {
  execFileSync('node', ['--check', file], { stdio: 'pipe' });
}
console.log(`syntax check ok (${files.length} files)`);
