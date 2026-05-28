import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk('js');
const risky = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\.innerHTML\s*=/.test(line) || /replaceChildren\s*\(/.test(line)) {
      risky.push({ file, line: index + 1, text: line.trim() });
    }
  });
}
const allowed = new Set([
  'js/core/app.js',
  'js/core/navigation.js',
  'js/core/domUpdate.js'
]);
const moduleRisks = risky.filter(item => item.file.includes('/modules/') || item.file.includes('js/modules/'));
const report = {
  directDomWrites: risky.length,
  moduleDirectDomWrites: moduleRisks.length,
  status: moduleRisks.length <= 8 ? 'ok' : 'review',
  note: 'Phase 7 allows shell/navigation writes, but module-level writes must continue moving toward safeReplaceContent or granular updates.',
  findings: risky.filter(item => !allowed.has(item.file)).slice(0, 80)
};
fs.writeFileSync('rerender-risk-audit-phase7.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (moduleRisks.length > 8) process.exitCode = 1;
