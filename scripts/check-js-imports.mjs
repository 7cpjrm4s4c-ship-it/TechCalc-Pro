import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

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

function checkFile(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Syntax check failed for ${file}\n${stdout}${stderr}`));
        return;
      }
      resolve();
    });
  });
}

async function runLimited(files, limit) {
  let index = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (index < files.length) {
      const file = files[index++];
      await checkFile(file);
    }
  });
  await Promise.all(workers);
}

const files = walk(root).filter(file => !file.includes('/node_modules/'));
const concurrency = Math.max(2, Math.min(os.cpus().length || 2, 8));
await runLimited(files, concurrency);
console.log(`syntax check ok (${files.length} files, concurrency ${concurrency})`);
