import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const viewportMatch = index.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);

assert.ok(viewportMatch, 'index.html must define a viewport meta tag');
const viewportContent = viewportMatch[1];

assert.match(viewportContent, /width=device-width/, 'viewport must keep device-width layout');
assert.match(viewportContent, /initial-scale=1/, 'viewport must keep initial-scale=1');
assert.match(viewportContent, /viewport-fit=cover/, 'viewport must keep safe-area viewport-fit support');
assert.doesNotMatch(viewportContent, /user-scalable\s*=\s*no/i, 'viewport must not disable user zoom');
assert.doesNotMatch(viewportContent, /maximum-scale\s*=\s*1(?:\.0+)?/i, 'viewport must not cap zoom at maximum-scale=1');

const allHtmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) allHtmlFiles.push(full);
  }
}
walk(root);

for (const file of allHtmlFiles) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i, `${rel} must not disable user zoom`);
}

console.log('phase38c viewport accessibility guard ok');
