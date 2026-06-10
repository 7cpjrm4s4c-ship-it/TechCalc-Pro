import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modulePrefixes = ['dw-', 'ph-', 'hx-', 'rainwater-', 'wastewater-'];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|css|html)$/.test(entry.name)) files.push(full);
  }
}

function isUiClassLine(line, file) {
  if (file.endsWith('.css')) return line.trim().startsWith('.') || line.includes(' .') || line.includes('[');
  return /class(Name)?=|classList|querySelector(All)?\(|matches\(/.test(line);
}

walk(path.join(root, 'js'));
walk(path.join(root, 'css'));

const hits = [];
for (const file of files) {
  const rel = path.relative(root, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!isUiClassLine(line, rel)) return;
    for (const prefix of modulePrefixes) {
      if (line.includes(prefix)) hits.push({ file: rel, line: index + 1, prefix, text: line.trim().slice(0, 180) });
    }
  });
}

console.log(JSON.stringify({
  checkedFiles: files.length,
  deprecatedPrefixes: modulePrefixes,
  legacyUiClassHits: hits.length,
  note: 'Legacy-Hits sind in Phase 3 erlaubt, muessen aber bei jeder Modulmigration sinken. Neue UI-Klassen muessen tc-* verwenden.',
  hits: hits.slice(0, 200)
}, null, 2));
