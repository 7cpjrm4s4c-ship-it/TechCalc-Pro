import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rel = (p) => path.relative(root, p).replaceAll(path.sep, '/');
const walk = (dir) => {
  const start = path.join(root, dir);
  const out = [];
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.js$/.test(entry.name)) out.push(full);
    }
  }
  return out.sort();
};

const files = walk('js').map(rel);
const directConsole = [];
for (const file of files) {
  if (file === 'js/core/logger.js') continue;
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const matches = [...content.matchAll(/\bconsole\s*(?:\.|\[)/g)];
  if (matches.length) directConsole.push({ file, count: matches.length });
}

const loggerPath = path.join(root, 'js/core/logger.js');
const loggerContent = fs.readFileSync(loggerPath, 'utf8');
const required = ['debug(message, details, meta)', 'info(message, details, meta)', 'warn(message, details, meta)', 'error(message, details, meta)', 'setLevel(level)'];
const missing = required.filter((token) => !loggerContent.includes(token));

if (directConsole.length || missing.length) {
  console.error('Phase 44B.4 runtime diagnostics audit failed.');
  if (directConsole.length) console.error('Direct console usage:', JSON.stringify(directConsole, null, 2));
  if (missing.length) console.error('Missing logger API:', missing.join(', '));
  process.exit(1);
}

console.log(`Phase 44B.4 runtime diagnostics audit ok (${files.length} runtime files, central logger enforced)`);
